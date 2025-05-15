// 脚本用于检查和修改当前激活的提示词模板

// 1. 检查当前活动的模板ID (在localStorage中)
const currentTemplateId = localStorage.getItem('sn43_activePromptTemplateId');
console.log('当前活动的模板ID:', currentTemplateId || '(未设置，默认为advanced)');

// 2. 获取IndexedDB中的所有模板
async function getAllTemplates() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sn43-templates-db', 1);
    
    request.onerror = () => reject('无法打开IndexedDB');
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('prompt-templates', 'readonly');
      const store = tx.objectStore('prompt-templates');
      const allTemplatesRequest = store.getAll();
      
      allTemplatesRequest.onsuccess = () => {
        const templates = allTemplatesRequest.result;
        db.close();
        resolve(templates);
      };
      
      allTemplatesRequest.onerror = () => {
        db.close();
        reject('获取模板失败');
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('prompt-templates')) {
        db.createObjectStore('prompt-templates', { keyPath: 'id' });
      }
    };
  });
}

// 3. 设置活动模板为iteration2
function setActiveTemplate(templateId) {
  localStorage.setItem('sn43_activePromptTemplateId', templateId);
  console.log(`已将活动模板设置为: ${templateId}`);
}

// 4. 执行检查
(async function() {
  try {
    console.log('==========================================');
    console.log('提示词模板信息检查工具');
    console.log('==========================================');
    
    // 获取所有模板
    const templates = await getAllTemplates();
    console.log(`IndexedDB中共有 ${templates.length} 个模板:`);
    
    // 显示所有模板信息
    templates.forEach(template => {
      const active = template.id === currentTemplateId ? ' [当前激活]' : '';
      const defaultTag = template.isDefault ? ' [内置]' : '';
      const hiddenTag = template.hidden ? ' [隐藏]' : '';
      console.log(`- ${template.name} (ID: ${template.id})${active}${defaultTag}${hiddenTag}`);
    });
    
    console.log('==========================================');
    console.log('如何修改激活的模板:');
    console.log('1. 自动设置为"迭代版2.0"(iteration2):');
    console.log('   setActiveTemplate("iteration2")');
    console.log('2. 通过UI设置:');
    console.log('   - 打开SN43Demo');
    console.log('   - 点击顶部导航栏的"提示词模板"选项卡');
    console.log('   - 在左侧列表中点击"迭代版2.0"');
    console.log('==========================================');
    
  } catch (error) {
    console.error('检查失败:', error);
  }
})();
