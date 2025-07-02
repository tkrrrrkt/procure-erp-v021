-- ================================================
-- ProcureERP PostgreSQL初期化スクリプト
-- マルチテナント対応企業級ERP システム
-- ================================================

-- データベース作成
CREATE DATABASE procure_erp_db;
CREATE DATABASE procure_erp_test;

-- 専用ユーザー作成
CREATE USER procure_erp_user WITH ENCRYPTED PASSWORD 'procure_erp_password_2024!';
CREATE USER procure_erp_admin WITH ENCRYPTED PASSWORD 'procure_admin_password_2024!';

-- 権限設定
GRANT ALL PRIVILEGES ON DATABASE procure_erp_db TO procure_erp_user;
GRANT ALL PRIVILEGES ON DATABASE procure_erp_test TO procure_erp_user;
GRANT ALL PRIVILEGES ON DATABASE procure_erp_db TO procure_erp_admin;
GRANT ALL PRIVILEGES ON DATABASE procure_erp_test TO procure_erp_admin;

-- procure_erp_dbに接続
\c procure_erp_db;

-- 拡張機能有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- スキーマ作成
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS logs;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Row Level Security (RLS) 用関数
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- テナント情報テーブル
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    auth0_organization_id VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    max_users INTEGER DEFAULT 10,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- デフォルトテナント作成
INSERT INTO tenants (id, name, slug, domain, auth0_organization_id, subscription_tier, max_users) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Default Organization',
    'default',
    'localhost',
    'default-org',
    'enterprise',
    1000
) ON CONFLICT (id) DO NOTHING;

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth0_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    nickname VARCHAR(255),
    picture TEXT,
    role VARCHAR(50) DEFAULT 'user',
    permissions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ユーザーテーブルのRLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのRLSポリシー
CREATE POLICY users_tenant_isolation ON users
    USING (tenant_id = current_tenant_id());

-- 仕入先テーブル
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    fax VARCHAR(50),
    postal_code VARCHAR(10),
    address TEXT,
    website VARCHAR(255),
    business_type VARCHAR(100),
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    contact_person VARCHAR(255),
    payment_terms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'JPY',
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    bank_account_type VARCHAR(20),
    bank_account_number VARCHAR(50),
    bank_account_holder VARCHAR(255),
    rating VARCHAR(10) DEFAULT 'A',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, code)
);

-- 仕入先テーブルのRLS有効化
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_tenant_isolation ON vendors
    USING (tenant_id = current_tenant_id());

-- 倉庫テーブル
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'main',
    location TEXT,
    manager_id UUID REFERENCES users(id),
    capacity_limit DECIMAL(15,2),
    current_capacity DECIMAL(15,2) DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, code)
);

-- 倉庫テーブルのRLS有効化
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY warehouses_tenant_isolation ON warehouses
    USING (tenant_id = current_tenant_id());

-- 商品カテゴリテーブル
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, code)
);

-- 商品カテゴリテーブルのRLS有効化
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_categories_tenant_isolation ON product_categories
    USING (tenant_id = current_tenant_id());

-- 商品テーブル
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(15,2) DEFAULT 0,
    standard_cost DECIMAL(15,2) DEFAULT 0,
    min_stock_level DECIMAL(15,2) DEFAULT 0,
    max_stock_level DECIMAL(15,2) DEFAULT 0,
    reorder_point DECIMAL(15,2) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 7,
    specifications JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    barcode VARCHAR(255),
    weight DECIMAL(10,3),
    dimensions JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, code)
);

-- 商品テーブルのRLS有効化
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_tenant_isolation ON products
    USING (tenant_id = current_tenant_id());

-- 在庫テーブル
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0,
    available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    last_movement_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, product_id, warehouse_id)
);

-- 在庫テーブルのRLS有効化
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_tenant_isolation ON inventory
    USING (tenant_id = current_tenant_id());

-- 購買申請テーブル
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requester_id UUID NOT NULL REFERENCES users(id),
    department VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    requested_date DATE NOT NULL,
    required_date DATE,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'JPY',
    status VARCHAR(20) DEFAULT 'draft',
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, request_number)
);

-- 購買申請テーブルのRLS有効化
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_requests_tenant_isolation ON purchase_requests
    USING (tenant_id = current_tenant_id());

-- 購買申請明細テーブル
CREATE TABLE IF NOT EXISTS purchase_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description TEXT NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    preferred_vendor_id UUID REFERENCES vendors(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 購買申請明細テーブルのRLS有効化
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_request_items_tenant_isolation ON purchase_request_items
    USING (tenant_id = current_tenant_id());

-- 発注テーブル
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    order_date DATE NOT NULL,
    required_date DATE,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'draft',
    payment_terms INTEGER DEFAULT 30,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'JPY',
    delivery_address TEXT,
    billing_address TEXT,
    contact_person VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, order_number)
);

-- 発注テーブルのRLS有効化
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_orders_tenant_isolation ON purchase_orders
    USING (tenant_id = current_tenant_id());

-- 発注明細テーブル
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description TEXT NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_quantity DECIMAL(15,3) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 発注明細テーブルのRLS有効化
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_order_items_tenant_isolation ON purchase_order_items
    USING (tenant_id = current_tenant_id());

-- 監査ログテーブル
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_auth0_org ON tenants(auth0_organization_id);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(tenant_id, name);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant_id ON warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(tenant_id, code);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_inventory_tenant_product_warehouse ON inventory(tenant_id, product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_tenant_id ON purchase_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_number ON purchase_requests(tenant_id, request_number);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(tenant_id, order_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit.audit_logs(created_at);

-- 権限設定
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO procure_erp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO procure_erp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO procure_erp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO procure_erp_user;

-- 管理者権限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO procure_erp_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO procure_erp_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logs TO procure_erp_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO procure_erp_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO procure_erp_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO procure_erp_admin;

-- 初期化完了ログ
INSERT INTO audit.audit_logs (tenant_id, action, table_name, record_id, new_data, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'SYSTEM_INIT',
    'database',
    uuid_generate_v4(),
    '{"message": "Database initialization completed", "version": "1.0.0"}',
    NOW()
);

COMMIT;
