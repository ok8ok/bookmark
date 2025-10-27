<template>
  <div class="settings-section">
    <h2 class="section-title">外观设置</h2>
    
    <!-- 自定义标题 -->
    <div class="form-group">
      <label class="form-label">自定义标题</label>
      <div class="form-row">
        <input 
          type="text" 
          :value="customTitle" 
          class="form-input" 
          readonly
        />
        <button class="btn btn-secondary" @click="$emit('editTitle')">
          编辑
        </button>
      </div>
      <div class="form-hint">修改页面顶部标题文字</div>
    </div>
    
    <!-- 自定义页脚 -->
    <div class="form-group">
      <label class="form-label">自定义页脚</label>
      <div class="form-row">
        <div class="footer-preview" v-html="footerContent"></div>
        <button class="btn btn-secondary" @click="$emit('editFooter')">
          编辑
        </button>
      </div>
      <div class="form-hint">修改页面底部内容（支持HTML）</div>
    </div>
    
    <!-- 主题模式 -->
    <div class="form-group">
      <label class="form-label">主题模式</label>
      <div class="form-row">
        <select 
          class="form-select"
          :value="themeMode"
          @change="handleThemeChange"
        >
          <option value="light">🌞 亮色模式</option>
          <option value="dark">🌙 暗色模式</option>
          <option value="system">💻 跟随系统</option>
        </select>
      </div>
      <div class="form-hint">
        {{ 
          themeMode === 'light' ? '使用亮色主题' : 
          themeMode === 'dark' ? '使用暗色主题' : 
          '根据系统设置自动切换主题'
        }}
      </div>
    </div>
    
    <!-- 显示搜索栏 -->
    <div class="form-group">
      <label class="form-label">显示搜索栏</label>
      <div class="form-row">
        <span class="form-text">{{ showSearch ? '已开启' : '已关闭' }}</span>
        <label class="switch">
          <input 
            type="checkbox" 
            :checked="showSearch"
            @change="$emit('toggleSearch')"
          >
          <span class="slider"></span>
        </label>
      </div>
      <div class="form-hint">在顶部显示搜索功能</div>
    </div>
    
    <!-- 隐藏空分类 -->
    <div class="form-group">
      <label class="form-label">隐藏空分类</label>
      <div class="form-row">
        <span class="form-text">{{ hideEmptyCategories ? '已开启' : '已关闭' }}</span>
        <label class="switch">
          <input 
            type="checkbox" 
            :checked="hideEmptyCategories"
            @change="$emit('toggleHideEmpty')"
          >
          <span class="slider"></span>
        </label>
      </div>
      <div class="form-hint">不显示没有书签的分类</div>
    </div>

    <!-- 公开模式 -->
    <div class="form-group">
      <label class="form-label">访问模式</label>
      <div class="form-row">
        <span class="form-text">{{ publicMode ? '公开模式' : '非公开模式' }}</span>
        <label class="switch">
          <input
            type="checkbox"
            :checked="publicMode"
            @change="$emit('togglePublicMode')"
          >
          <span class="slider"></span>
        </label>
      </div>
      <div class="form-hint">
        {{ publicMode ? '未登录用户可访问公开书签' : '未登录用户无法访问书签和分类' }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  themeMode: String,
  isDark: Boolean,
  showSearch: Boolean,
  hideEmptyCategories: Boolean,
  publicMode: Boolean,
  customTitle: String,
  footerContent: String
})

const emit = defineEmits(['editTitle', 'editFooter', 'setThemeMode', 'toggleSearch', 'toggleHideEmpty', 'togglePublicMode'])

const handleThemeChange = (event) => {
  emit('setThemeMode', event.target.value)
}
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
  content: '🎨';
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
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  opacity: 0;
  transition: var(--transition);
}

.form-group:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--shadow-md);
  border-color: var(--primary);
}

.form-group:hover::before {
  opacity: 1;
}

.form-label {
  display: block;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.form-label::before {
  content: '⚡';
  font-size: var(--text-base);
}

.form-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.form-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  color: var(--text);
  font-size: var(--text-sm);
  transition: var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:read-only {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.form-select {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  color: var(--text);
  font-size: var(--text-sm);
  transition: var(--transition);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  background-size: 1em;
  padding-right: 2.5rem;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-text {
  flex: 1;
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.form-hint::before {
  content: '💡';
  font-size: var(--text-xs);
}

.footer-preview {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-secondary);
  max-height: 60px;
  overflow: hidden;
}

.btn {
  padding: var(--space-3) var(--space-5);
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

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text);
  border: 2px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--border);
  transition: var(--transition);
  border-radius: var(--radius-full);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 4px;
  bottom: 4px;
  background: white;
  transition: var(--transition);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.switch input:checked + .slider {
  background: var(--primary);
  box-shadow: inset 0 2px 4px rgba(99, 102, 241, 0.3);
}

.switch input:checked + .slider:before {
  transform: translateX(28px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.switch:hover .slider {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.switch:hover input:checked + .slider {
  box-shadow: inset 0 2px 4px rgba(99, 102, 241, 0.4);
}
</style>
