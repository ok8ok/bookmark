-- 添加父分类ID字段以支持多级嵌套结构
ALTER TABLE categories ADD COLUMN parent_id INTEGER DEFAULT NULL REFERENCES categories(id) ON DELETE CASCADE;

-- 为parent_id创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- 添加深度字段用于优化查询和避免过深嵌套
ALTER TABLE categories ADD COLUMN depth INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_parent_position ON categories(parent_id, position);
