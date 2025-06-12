// --- Local Storage Key ---
const LOCAL_STORAGE_KEY = 'promptsData';

// 分页相关变量
let currentPage = 1;
const itemsPerPage = 6;

// 搜索和过滤变量
let currentSearchTerm = '';
let currentTagFilter = '';
let allPrompts = []; // 存储所有提示词用于过滤

// Wrap entire script logic in a try...catch block for robustness
try {
    console.log("Initializing application...");

    // --- DOM Elements ---
    console.log("Getting DOM elements...");
    const viewPromptsBtn = document.getElementById('view-prompts-btn');
    const addPromptBtn = document.getElementById('add-prompt-btn');
    const viewPromptsView = document.getElementById('view-prompts-view');
    const addPromptView = document.getElementById('add-prompt-view');
    const views = document.querySelectorAll('.view');
    const navBtns = document.querySelectorAll('.nav-btn');
    const addPromptForm = document.getElementById('add-prompt-form');
    const promptList = document.getElementById('prompt-list'); // Container for event delegation
    const promptTitleInput = document.getElementById('prompt-title');
    const promptTextInput = document.getElementById('prompt-text');
    const promptTagsInput = document.getElementById('prompt-tags');
    const submitButton = addPromptForm ? addPromptForm.querySelector('button[type="submit"]') : null;
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');
    console.log("DOM elements obtained.");

    // --- State ---
    let editingPromptId = null; // Tracks the Firestore document ID being edited

    // --- Initialization ---
    loadPrompts(); // Load data from Local Storage on startup
    setActiveView(viewPromptsView, viewPromptsBtn); // Set initial view
    
    // --- 搜索和过滤事件处理 ---
    const searchInput = document.getElementById('prompt-search');
    const tagFilterSelect = document.getElementById('tag-filter');
    
    if (searchInput) {
        // 使用防抖处理搜索，避免频繁刷新
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchTerm = searchInput.value.trim();
                currentPage = 1; // 重置为第一页
                loadPrompts();
            }, 300); // 300ms防抖
        });
    }
    
    if (tagFilterSelect) {
        tagFilterSelect.addEventListener('change', () => {
            currentTagFilter = tagFilterSelect.value;
            currentPage = 1; // 重置为第一页
            loadPrompts();
        });
    }

    // --- View Switching ---
    function setActiveView(viewToShow, btnToActivate) {
        console.log(`Switching view. Target view: ${viewToShow?.id}, Target button: ${btnToActivate?.id}`);
        views.forEach(view => view.classList.remove('active'));
        navBtns.forEach(btn => btn.classList.remove('active'));
        if (viewToShow) viewToShow.classList.add('active');
        if (btnToActivate) btnToActivate.classList.add('active');

        if (viewToShow === viewPromptsView) {
            resetAddFormState();
            checkAllToggleButtonVisibility();
        }
    }

    if (viewPromptsBtn && addPromptBtn) {
        viewPromptsBtn.addEventListener('click', () => {
            console.log("View Prompts button clicked.");
            setActiveView(viewPromptsView, viewPromptsBtn);
        });
        addPromptBtn.addEventListener('click', () => {
            console.log("Add Prompt button clicked.");
            setActiveView(addPromptView, addPromptBtn);
        });
        console.log("View switch buttons listeners attached.");
    } else {
        console.error("View switch buttons not found!");
    }


    // --- Form Handling (Add/Update to Firestore) ---
    if (addPromptForm && submitButton) {
        addPromptForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log("Add/Update form submitted.");
            submitButton.disabled = true;
            submitButton.textContent = editingPromptId ? '更新中...' : '添加中...';

            const title = promptTitleInput.value.trim();
            const text = promptTextInput.value.trim();
            const tags = promptTagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            if (!title || !text) {
                alert('标题和提示词内容不能为空！');
                resetSubmitButtonState();
                return;
            }

            try {
                if (editingPromptId) {
                    console.log(`Attempting to update prompt ID: ${editingPromptId}`);
                    updatePromptInLocalStorage(editingPromptId, { title, text, tags });
                    console.log("Prompt updated successfully in Local Storage:", editingPromptId);
                    await loadPrompts(); // Reload list to reflect changes
                } else {
                    console.log("Attempting to add new prompt.");
                    const newPrompt = {
                        id: Date.now().toString(), // Use timestamp as a simple unique ID
                        title,
                        text,
                        tags,
                        createdAt: Date.now() // Use current timestamp for creation date
                    };
                    addPromptToLocalStorage(newPrompt);
                    console.log("Prompt added successfully with ID:", newPrompt.id);
                    await loadPrompts(); // Reload list to show the new item
                }
                resetAddFormState();
                setActiveView(viewPromptsView, viewPromptsBtn);
            } catch (error) {
                console.error("Error saving prompt to Local Storage:", error);
                alert(`保存提示词失败: ${error.message}`);
                resetSubmitButtonState(); // Reset button on error
            }
        });
        console.log("Form submit listener attached.");
    } else {
        console.error("Add prompt form or submit button not found!");
    }

    // --- Cancel Edit Button Handler ---
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            console.log("Cancel edit button clicked.");
            resetAddFormState();
            setActiveView(viewPromptsView, viewPromptsBtn);
        });
        console.log("Cancel edit button listener attached.");
    } else {
        console.error("Cancel edit button not found!");
    }


    function resetAddFormState() {
        if (addPromptForm) addPromptForm.reset();
        editingPromptId = null;
        resetSubmitButtonState(); // Use helper to reset button
        if(addPromptView) addPromptView.querySelector('h2').textContent = '添加新提示词';

        // 隐藏取消按钮
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        console.log("Add form state reset.");
    }

    function resetSubmitButtonState() {
         if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = editingPromptId ? '更新提示词' : '添加收藏';
         }
    }


    // --- Local Storage Helper Functions ---
    function getPromptsFromLocalStorage() {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!data) {
            return []; // Return empty array if no data
        }
        try {
            const parsedData = JSON.parse(data);
            // Basic validation: check if it's an array
            if (!Array.isArray(parsedData)) {
                console.warn("Local storage data is not an array. Resetting to empty array.");
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear invalid data
                return [];
            }
            return parsedData;
        } catch (error) {
            console.error("Error parsing prompts from Local Storage:", error);
            console.warn("Resetting local storage due to parsing error.");
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            return []; // Return empty array on parsing error
        }
    }

    function savePromptsToLocalStorage(prompts) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prompts));
    }

    function addPromptToLocalStorage(prompt) {
        const prompts = getPromptsFromLocalStorage();
        prompts.push(prompt);
        savePromptsToLocalStorage(prompts);
    }

    function updatePromptInLocalStorage(id, updatedData) {
        let prompts = getPromptsFromLocalStorage();
        prompts = prompts.map(p => {
            if (p.id === id) {
                // Merge existing data with updated data, keep original createdAt and id
                return { ...p, ...updatedData };
            }
            return p;
        });
        savePromptsToLocalStorage(prompts);
    }

    function deletePromptFromLocalStorage(id) {
        let prompts = getPromptsFromLocalStorage();
        prompts = prompts.filter(p => p.id !== id);
        savePromptsToLocalStorage(prompts);
    }


    // --- Data Loading from Local Storage ---
    function loadPrompts() { // Removed async as operations are now synchronous
        console.log("Loading prompts from Local Storage...");
        if (!promptList) {
            console.error("Prompt list container not found during load!");
            return;
        }
        promptList.innerHTML = '<p style="text-align: center; color: var(--text-light);">加载中...</p>'; // Loading indicator

        try {
            // 获取所有提示词
            allPrompts = getPromptsFromLocalStorage();

            // 按创建时间排序（降序，最新的在前）
            allPrompts.sort((a, b) => b.createdAt - a.createdAt);

            // 初始化标签筛选下拉框
            populateTagFilter(allPrompts);

            // 应用搜索和标签过滤
            let filteredPrompts = filterPrompts(allPrompts, currentSearchTerm, currentTagFilter);

            promptList.innerHTML = ''; // Clear loading indicator/previous list
            if (filteredPrompts.length === 0) {
                 let message = '还没有收藏任何提示词。';
                 if (currentSearchTerm || currentTagFilter) {
                     message = '没有找到匹配的提示词。';
                 }
                 promptList.innerHTML = `<p style="text-align: center; color: var(--text-light);">${message}</p>`;
                 console.log("No prompts match current filters or Local Storage is empty.");
                 
                 // 隐藏分页导航
                 const paginationDiv = document.getElementById('pagination-controls');
                 if (paginationDiv) paginationDiv.style.display = 'none';
            } else {
                // 计算分页信息
                const totalItems = filteredPrompts.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                
                // 确保当前页有效
                if (currentPage > totalPages) currentPage = totalPages;
                if (currentPage < 1) currentPage = 1;
                
                // 计算当前页的数据范围
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
                
                // 只显示当前页的提示词
                const currentPagePrompts = filteredPrompts.slice(startIndex, endIndex);
                
                // 渲染当前页的提示词
                currentPagePrompts.forEach((promptData) => {
                    // Ensure tags is an array (might be redundant if saved correctly, but good practice)
                    if (!Array.isArray(promptData.tags)) promptData.tags = [];
                    const listItem = createPromptListItem(promptData.id, promptData); // Pass local ID
                    promptList.appendChild(listItem);
                });
                
                // 更新分页控件
                updatePaginationControls(totalPages);
                
                checkAllToggleButtonVisibility(); // Check visibility after rendering
                console.log(`Loaded ${currentPagePrompts.length} prompts (page ${currentPage}/${totalPages}, filtered from ${allPrompts.length} total).`);
            }
        } catch (error) {
            console.error("Error loading prompts from Local Storage:", error);
            alert(`加载提示词列表失败: ${error.message}`);
            promptList.innerHTML = '<p style="color: red; text-align: center;">加载失败，请检查本地存储或代码。</p>';
        }
    }

    // 过滤提示词函数
    function filterPrompts(prompts, searchTerm, tagFilter) {
        return prompts.filter(prompt => {
            // 标签过滤
            if (tagFilter && (!prompt.tags || !prompt.tags.includes(tagFilter))) {
                return false;
            }
            
            // 搜索过滤 (标题、内容或标签)
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const titleMatch = prompt.title.toLowerCase().includes(searchLower);
                const textMatch = prompt.text.toLowerCase().includes(searchLower);
                
                // 检查标签匹配
                let tagMatch = false;
                if (prompt.tags && Array.isArray(prompt.tags)) {
                    tagMatch = prompt.tags.some(tag => 
                        tag.toLowerCase().includes(searchLower)
                    );
                }
                
                return titleMatch || textMatch || tagMatch;
            }
            
            return true; // 如果没有过滤条件，返回所有提示词
        });
    }

    // 填充标签筛选下拉框
    function populateTagFilter(prompts) {
        const tagFilter = document.getElementById('tag-filter');
        if (!tagFilter) return;
        
        // 保存当前选中值
        const currentValue = tagFilter.value;
        
        // 清除现有选项，但保留"所有标签"选项
        while (tagFilter.options.length > 1) {
            tagFilter.remove(1);
        }
        
        // 收集所有不重复的标签
        const allTags = new Set();
        prompts.forEach(prompt => {
            if (prompt.tags && Array.isArray(prompt.tags)) {
                prompt.tags.forEach(tag => tag && allTags.add(tag));
            }
        });
        
        // 按字母顺序排序标签
        const sortedTags = Array.from(allTags).sort();
        
        // 添加到下拉框
        sortedTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
        
        // 尝试恢复之前的选择
        if (currentValue) {
            for (let i = 0; i < tagFilter.options.length; i++) {
                if (tagFilter.options[i].value === currentValue) {
                    tagFilter.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // --- Creating List Item DOM (No Event Listeners Here) ---
    function createPromptListItem(id, prompt) {
        const listItem = document.createElement('li');
        listItem.classList.add('prompt-item');
        listItem.dataset.id = id; // Store Local Storage item ID

        // Store data needed for actions directly on the element
        listItem.dataset.title = prompt.title;
        listItem.dataset.text = prompt.text;
        listItem.dataset.tags = prompt.tags.join(','); // Store tags as comma-separated string

        // Title
        const titleElement = document.createElement('h3');
        titleElement.textContent = prompt.title;

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('prompt-content');
        const textElement = document.createElement('p');
        textElement.classList.add('prompt-text');
        textElement.textContent = prompt.text;
        const toggleButton = document.createElement('button'); // Still create the button
        toggleButton.classList.add('toggle-btn');
        toggleButton.textContent = '展开';
        toggleButton.style.display = 'none'; // Hide initially, CSS/JS will show if needed
        contentDiv.appendChild(textElement);
        contentDiv.appendChild(toggleButton);

        // Tags
        const tagsContainer = document.createElement('div');
        tagsContainer.classList.add('tags');
        if (prompt.tags && prompt.tags.length > 0) {
            prompt.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        } else {
            tagsContainer.style.display = 'none';
        }

        // Actions Container (Create buttons, but don't attach listeners here)
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('prompt-actions');
        actionsDiv.innerHTML = `
            <button class="copy-btn">复制</button>
            <button class="edit-btn">编辑</button>
            <button class="delete-btn">删除</button>
        `; // Use innerHTML for simplicity or create elements as before

        // Assemble
        listItem.appendChild(titleElement);
        listItem.appendChild(contentDiv);
        listItem.appendChild(tagsContainer);
        listItem.appendChild(actionsDiv);

        return listItem;
    }

    // --- Event Delegation for List Items ---
    if (promptList) {
        promptList.addEventListener('click', (event) => { // Removed async as handlers are sync (except potential future handleDelete changes)
            const target = event.target;
            console.log("Click detected inside prompt list. Target:", target);

            const promptItem = target.closest('.prompt-item'); // Find the parent list item

            if (!promptItem) {
                console.log("Click was outside a prompt item.");
                return; // Click wasn't inside a prompt item
            }
            console.log("Clicked inside prompt item:", promptItem.dataset.id);

            const promptId = promptItem.dataset.id;
            const promptTitle = promptItem.dataset.title;
            const promptText = promptItem.dataset.text;
            // Safely recreate tags array, handling potential empty string
            const promptTags = promptItem.dataset.tags ? promptItem.dataset.tags.split(',').filter(t => t) : [];

            // Handle Toggle Button Click
            if (target.classList.contains('toggle-btn')) {
                console.log("Toggle button clicked for item:", promptId);
                handleToggle(target, promptItem.querySelector('.prompt-text'));
            }
            // Handle Copy Button Click
            else if (target.classList.contains('copy-btn')) {
                console.log("Copy button clicked for item:", promptId);
                handleCopy(target, promptText);
            }
            // Handle Edit Button Click
            else if (target.classList.contains('edit-btn')) {
                console.log("Edit button clicked for item:", promptId);
                handleEdit(promptId, { title: promptTitle, text: promptText, tags: promptTags });
            }
            // Handle Delete Button Click
            else if (target.classList.contains('delete-btn')) {
                console.log("Delete button clicked for item:", promptId);
                handleDelete(promptItem, promptId, promptTitle); // Removed await as handleDelete is now sync
            } else {
                console.log("Clicked element is not a recognized action button.");
            }
        });
        console.log("Event delegation listener attached to prompt list.");
    } else {
        console.error("Prompt list container not found! Event delegation cannot be attached.");
    }


    // --- Action Handlers (Called by Event Delegation) ---
    function handleEdit(id, prompt) {
        console.log(`Populating edit form for ID: ${id}`);
        if (promptTitleInput) promptTitleInput.value = prompt.title;
        if (promptTextInput) promptTextInput.value = prompt.text;
        if (promptTagsInput) promptTagsInput.value = prompt.tags.join(', ');
        editingPromptId = id; // Store the Local Storage item ID
        if (submitButton) submitButton.textContent = '更新提示词';
        if (addPromptView) addPromptView.querySelector('h2').textContent = '编辑提示词';

        // 显示取消按钮
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        setActiveView(addPromptView, addPromptBtn);
    }

    function handleDelete(listItem, id, title) { // Removed async
        if (confirm(`确定要删除标题为 "${title}" 的提示词吗？`)) {
            console.log("Attempting to delete prompt with ID:", id);
            try {
                deletePromptFromLocalStorage(id);
                listItem.remove(); // Remove from DOM on success
                console.log("Prompt deleted successfully from Local Storage and DOM.");
                // Optional: Show a temporary success message
            } catch (error) {
                console.error("Error deleting prompt from Local Storage:", error);
                alert(`删除提示词失败: ${error.message}`);
            }
        } else {
            console.log("Deletion cancelled by user.");
        }
    }

    function handleCopy(buttonElement, textToCopy) {
        console.log("Attempting to copy text:", textToCopy);
        if (!navigator.clipboard) {
            alert('抱歉，您的浏览器不支持复制功能。');
            console.warn("Clipboard API not supported.");
            return;
        }
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log("Text copied successfully.");
            const originalText = buttonElement.textContent;
            buttonElement.textContent = '已复制!';
            buttonElement.disabled = true;
            setTimeout(() => {
                if (document.body.contains(buttonElement)) {
                    buttonElement.textContent = originalText;
                    buttonElement.disabled = false;
                }
            }, 1500);
        }).catch(err => {
            console.error('无法复制文本: ', err);
            alert('复制失败，请手动复制。');
        });
    }

    function handleToggle(toggleButton, textElement) {
        if (!toggleButton || !textElement) {
            console.warn("Toggle button or text element not found for toggle action.");
            return;
        }

        const promptItem = toggleButton.closest('.prompt-item');
        if (!promptItem) return;

        const promptId = promptItem.dataset.id;
        const promptTitle = promptItem.dataset.title;
        const promptText = promptItem.dataset.text;
        const promptTagsString = promptItem.dataset.tags;
        const promptTags = promptTagsString ? promptTagsString.split(',').filter(t => t) : [];

        // 如果已存在弹窗，先移除
        const existingPopup = document.getElementById('prompt-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // 创建弹出窗口
        createPopup(promptId, promptTitle, promptText, promptTags);
        
        // 只更新按钮文本，不修改原有提示词框
        if (toggleButton.textContent === '展开') {
            toggleButton.textContent = '折叠';
        } else {
            toggleButton.textContent = '展开';
        }
        
        console.log(`Popup opened for prompt ID: ${promptId}`);
    }

    // 创建弹出窗口
    function createPopup(id, title, text, tags) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'popup-overlay';
        document.body.appendChild(overlay);
        
        const popup = document.createElement('div');
        popup.id = 'prompt-popup';
        popup.className = 'prompt-text expanded';
        
        // 创建弹出窗口内容
        const headerHTML = `
            <div class="prompt-popup-header">
                <h3>${title}</h3>
            </div>
        `;
        
        const contentHTML = `
            <div class="prompt-popup-content">${text}</div>
        `;
        
        let tagsHTML = '';
        if (tags.length > 0) {
            tagsHTML = `
                <div class="prompt-popup-tags">
                    ${tags.map(tag => `<span>${tag}</span>`).join('')}
                </div>
            `;
        }
        
        const footerHTML = `
            <div class="prompt-popup-footer">
                <button class="copy-popup-btn" data-text="${text.replace(/"/g, '&quot;')}">复制内容</button>
            </div>
        `;
        
        popup.innerHTML = headerHTML + contentHTML + tagsHTML + footerHTML;
        
        // 创建关闭按钮并添加到弹窗
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-popup-btn';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.textContent = '✖';
        popup.appendChild(closeBtn);
        
        // 添加到body
        document.body.appendChild(popup);

        // 关闭弹窗的函数
        const closePopup = () => {
            popup.remove();
            overlay.remove();
            // 查找对应的toggle按钮并更新状态
            const promptItem = document.querySelector(`.prompt-item[data-id="${id}"]`);
            if (promptItem) {
                const toggleBtn = promptItem.querySelector('.toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '展开';
            }
        };
        
        // 点击遮罩层关闭弹窗
        overlay.addEventListener('click', closePopup);
        
        // 添加关闭按钮事件
        closeBtn.addEventListener('click', closePopup);
        
        // 添加复制按钮事件
        const copyBtn = popup.querySelector('.copy-popup-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                const textToCopy = this.getAttribute('data-text');
                handleCopy(this, textToCopy);
            });
        }
        
        // 添加ESC键关闭功能
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closePopup();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // --- Expand/Collapse Visibility Check ---
    function checkAllToggleButtonVisibility() {
        console.log("Checking visibility for all toggle buttons...");
        const items = promptList.querySelectorAll('.prompt-item');
        items.forEach(item => {
            try { // Add try...catch around individual item processing
                const textElement = item.querySelector('.prompt-text');
                const toggleButton = item.querySelector('.toggle-btn');
                if (textElement && toggleButton) {
                    checkSingleToggleButtonVisibility(textElement, toggleButton);
                }
            } catch (error) {
                console.error("Error processing visibility for item:", item.dataset.id, error);
                // Continue to the next item even if one fails
            }
        });
    }

    function checkSingleToggleButtonVisibility(textElement, toggleButton) {
        // Use requestAnimationFrame for better timing after render
        requestAnimationFrame(() => {
            // The requestAnimationFrame already provides some error isolation,
            // but we add another layer inside for safety during calculation.
            try {
                // Check offsetHeight first - if 0, element is likely hidden or empty
                if (textElement.offsetHeight > 0 && textElement.scrollHeight > 0) {
                    const computedStyle = getComputedStyle(textElement);
                    // Ensure line-height is a valid number, default if not
                    let lineHeight = parseFloat(computedStyle.lineHeight);
                    if (isNaN(lineHeight)) {
                        // Estimate based on font size if line-height is 'normal' or invalid
                        lineHeight = parseFloat(computedStyle.fontSize) * 1.2; // Common approximation
                    }
                     // Check scrollHeight against approx 3.5 lines height
                    const isOverflowing = textElement.scrollHeight > (lineHeight * 3.5 + 5); // Add small buffer
                    toggleButton.style.display = isOverflowing ? 'inline-block' : 'none';
                    // console.log(`ID: ${toggleButton.closest('.prompt-item')?.dataset.id}, ScrollH: ${textElement.scrollHeight}, LineH: ${lineHeight}, OffsetH: ${textElement.offsetHeight}, Overflow: ${isOverflowing}`);
                } else {
                     // If not visible or no scroll height, hide button
                     toggleButton.style.display = 'none';
                }
            } catch (e) {
                console.error("Error checking toggle button visibility:", e, textElement);
                toggleButton.style.display = 'none'; // Hide if error occurs
            }
        });
    }
    
    // --- 分页功能 ---
    function updatePaginationControls(totalPages) {
        // 获取分页控件容器
        const paginationDiv = document.getElementById('pagination-controls');
        if (!paginationDiv) {
            console.error("分页控件容器不存在！");
            return;
        }
        
        // 显示分页控件
        paginationDiv.style.display = totalPages > 1 ? 'flex' : 'none';
        
        // 清空现有内容
        paginationDiv.innerHTML = '';
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.classList.add('pagination-btn');
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadPrompts();
            }
        });
        
        // 页码信息
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        pageInfo.classList.add('page-info');
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.classList.add('pagination-btn');
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadPrompts();
            }
        });
        
        // 添加到分页容器
        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(pageInfo);
        paginationDiv.appendChild(nextBtn);
    }

    // --- 数据导入导出功能 ---

    // 导出数据功能
    function exportData() {
        try {
            const prompts = getPromptsFromLocalStorage();
            const dataToExport = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                prompts: prompts
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            // 创建下载链接
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = `ai-prompts-backup-${new Date().toISOString().split('T')[0]}.json`;

            // 触发下载
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // 清理URL对象
            URL.revokeObjectURL(downloadLink.href);

            console.log("Data exported successfully");
            alert(`成功导出 ${prompts.length} 条提示词数据！`);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert(`导出数据失败: ${error.message}`);
        }
    }

    // 导入数据功能
    function importData(file) {
        if (!file) {
            alert('请选择一个文件！');
            return;
        }

        if (!file.name.endsWith('.json')) {
            alert('请选择一个 JSON 文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                // 验证数据格式
                if (!importedData.prompts || !Array.isArray(importedData.prompts)) {
                    throw new Error('无效的数据格式：缺少 prompts 数组');
                }

                // 确认导入操作
                const currentPrompts = getPromptsFromLocalStorage();
                const confirmMessage = `即将导入 ${importedData.prompts.length} 条提示词数据。\n\n警告：这将覆盖您当前的 ${currentPrompts.length} 条数据！\n\n确定要继续吗？`;

                if (!confirm(confirmMessage)) {
                    console.log("Import cancelled by user");
                    return;
                }

                // 验证每个提示词的基本结构
                const validPrompts = importedData.prompts.filter(prompt => {
                    return prompt &&
                           typeof prompt.title === 'string' &&
                           typeof prompt.text === 'string' &&
                           prompt.title.trim() !== '' &&
                           prompt.text.trim() !== '';
                });

                if (validPrompts.length === 0) {
                    throw new Error('导入的数据中没有有效的提示词');
                }

                // 为导入的数据添加必要的字段
                const processedPrompts = validPrompts.map(prompt => ({
                    id: prompt.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    title: prompt.title.trim(),
                    text: prompt.text.trim(),
                    tags: Array.isArray(prompt.tags) ? prompt.tags.filter(tag => tag && tag.trim()) : [],
                    createdAt: prompt.createdAt || Date.now()
                }));

                // 保存到本地存储
                savePromptsToLocalStorage(processedPrompts);

                // 重新加载数据
                loadPrompts();

                console.log(`Successfully imported ${processedPrompts.length} prompts`);
                alert(`成功导入 ${processedPrompts.length} 条提示词数据！${validPrompts.length < importedData.prompts.length ? `\n（跳过了 ${importedData.prompts.length - validPrompts.length} 条无效数据）` : ''}`);

            } catch (error) {
                console.error("Error importing data:", error);
                alert(`导入数据失败: ${error.message}`);
            }
        };

        reader.onerror = function() {
            alert('读取文件失败！');
        };

        reader.readAsText(file);
    }

    // --- 导入导出按钮事件监听器 ---
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
        console.log("Export data button listener attached.");
    } else {
        console.error("Export data button not found!");
    }

    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                importData(file);
                // 清空文件输入，允许重复选择同一文件
                event.target.value = '';
            }
        });

        console.log("Import data button and file input listeners attached.");
    } else {
        console.error("Import data button or file input not found!");
    }

} catch (error) {
    console.error("Fatal error initializing application or attaching listeners:", error);
    alert("应用程序初始化失败，请检查控制台错误信息。功能可能无法使用。");
    // Optionally display an error message in the UI
    const body = document.querySelector('body');
    if (body) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `初始化错误: ${error.message}. 请检查浏览器控制台获取详细信息。`;
        errorDiv.style.color = 'red';
        errorDiv.style.backgroundColor = 'pink';
        errorDiv.style.padding = '10px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.width = '100%';
        errorDiv.style.zIndex = '1000';
        body.prepend(errorDiv);
    }
}
