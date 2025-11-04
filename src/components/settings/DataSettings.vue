<template>
  <div class="settings-section">
    <h2 class="section-title">数据管理</h2>
    
    <!-- 导入导出 -->
    <div class="form-group">
      <div class="form-header">
        <div class="form-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div class="form-content">
          <div class="form-title">导入/导出</div>
          <div class="form-description">备份或恢复书签数据</div>
        </div>
      </div>
      <button class="btn btn-primary" @click="$emit('action', 'importExport')">
        导入/导出
      </button>
    </div>
    
    <!-- 清理空分类 -->
    <div class="form-group">
      <div class="form-header">
        <div class="form-icon cleanup-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="form-content">
          <div class="form-title">清理空分类</div>
          <div class="form-description">
            <span v-if="emptyCategoryCount > 0">
              发现 {{ emptyCategoryCount }} 个空分类，点击按钮清理
            </span>
            <span v-else>
              当前没有空分类
            </span>
          </div>
        </div>
      </div>
      <button 
        class="btn" 
        :class="emptyCategoryCount > 0 ? 'btn-warning' : 'btn-disabled'"
        @click="$emit('action', 'cleanupEmptyCategories')"
        :disabled="emptyCategoryCount === 0"
      >
        <svg v-if="emptyCategoryCount > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        {{ emptyCategoryCount > 0 ? '清理空分类' : '无空分类' }}
      </button>
    </div>
    
    <!-- 统计信息 -->
    <div class="form-group stats-group">
      <div class="form-header">
        <div class="form-icon stats-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9M13 17V5M8 17v-3"/>
          </svg>
        </div>
        <div class="form-content">
          <div class="form-title">书签统计</div>
          <div class="form-description">
            共 {{ totalBookmarks }} 个书签，其中 {{ privateBookmarks }} 个私密书签
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalBookmarks: Number,
  privateBookmarks: Number,
  emptyCategoryCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['action'])
</script>

<style scoped>
.settings-section {
  max-width: 800px;
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text);
  margin-bottom: var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-title::before {
  content: '📊';
  font-size: var(--text-xl);
}

.form-group {
  margin-bottom: var(--space-6);
  padding: var(--space-6);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.form-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--success), var(--success-light));
  opacity: 0;
  transition: var(--transition);
}

.form-group:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--shadow-md);
}

.form-group:hover::before {
  opacity: 1;
}

.form-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-icon {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: var(--transition);
}

.form-group:hover .form-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.form-icon svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

.form-content {
  flex: 1;
}

.form-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.form-title::before {
  content: '📁';
  font-size: var(--text-base);
}

.form-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.btn {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition);
  border: none;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.stats-group {
  cursor: default;
}

.stats-group:hover {
  border-color: var(--border);
  transform: none;
}

.stats-group:hover::before {
  opacity: 0;
}

.stats-icon {
  background: var(--success);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.form-group:hover .stats-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.cleanup-icon {
  background: var(--warning);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.form-group:hover .cleanup-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.btn-warning {
  background: var(--warning);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-disabled {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-disabled:hover {
  transform: none;
  box-shadow: none;
}

.btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}
</style>
