// IndexedDB存储管理
class ImageStorage {
    constructor() {
        this.dbName = 'portfolioImages';
        this.dbVersion = 1;
        this.db = null;
    }

    // 初始化数据库
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('IndexedDB错误:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建存储对象
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id' });
                }
            };
        });
    }

    // 保存图片数据
    saveImages(projectId, images) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                this.init().then(() => this.saveImages(projectId, images)).then(resolve).catch(reject);
                return;
            }

            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put({ id: projectId, images: images });

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 获取图片数据
    getImages(projectId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                this.init().then(() => this.getImages(projectId)).then(resolve).catch(reject);
                return;
            }

            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.get(projectId);

            request.onsuccess = (event) => {
                const data = event.target.result;
                resolve(data ? data.images : []);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 删除图片数据
    deleteImages(projectId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                this.init().then(() => this.deleteImages(projectId)).then(resolve).catch(reject);
                return;
            }

            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.delete(projectId);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// 创建存储实例
const imageStorage = new ImageStorage();

// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    // ===== 导航栏功能 =====
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

// 滚动时导航栏效果
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // 更新活动导航链接
    updateActiveNavLink();
});

// 移动端菜单切换
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// 点击导航链接后关闭移动端菜单
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navToggle && navMenu) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

// 更新活动导航链接
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ===== 平滑滚动 =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== 滚动显示动画 =====
const revealElements = document.querySelectorAll('.reveal');

function revealOnScroll() {
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 100) {
            element.classList.add('active');
        }
    });
}

// ===== 图片预览和缩放功能 =====

// 创建图片预览模态框
function createImageModal() {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img class="modal-image" src="" alt="预览图片">
        </div>
    `;
    document.body.appendChild(modal);
    
    // 关闭模态框
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    return modal;
}

const imageModal = createImageModal();
const modalImage = imageModal.querySelector('.modal-image');

// 为所有图片添加悬停和点击功能
function setupImageInteractions() {
    console.log('Setting up image interactions...');
    const galleryItems = document.querySelectorAll('.gallery-item');
    console.log('Found gallery items:', galleryItems.length);
    
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        console.log('Found img:', img);
        
        if (img) {
            // 点击图片放大
            img.addEventListener('click', function() {
                modalImage.src = img.src;
                imageModal.style.display = 'flex';
            });
        }
    });
    
    // 点击模态框中的图片可以缩放
    if (modalImage) {
        modalImage.addEventListener('click', function() {
            if (modalImage.classList.contains('zoomed')) {
                modalImage.classList.remove('zoomed');
            } else {
                modalImage.classList.add('zoomed');
            }
        });
    }
}

// 图片上传和保存功能
function initImageUpload() {
    // 为每个上传按钮添加事件监听器
    for (let i = 1; i <= 3; i++) {
        const uploadInput = document.getElementById(`upload-${i}`);
        if (uploadInput) {
            uploadInput.addEventListener('change', function(e) {
                const files = e.target.files;
                if (files.length > 100) {
                    alert('最多只能上传100张图片');
                    return;
                }
                
                const projectId = `project-${i}`;
                const gallery = document.getElementById(projectId);
                
                // 处理上传的图片
                handleImageUpload(files, projectId, gallery);
            });
        }
        
        // 为每个添加图片按钮添加事件监听器（跳过西北旺效果图展示）
        if (i !== 1) {
            const addButton = document.getElementById(`add-${i}`);
            if (addButton) {
                addButton.addEventListener('click', function() {
                    const projectId = `project-${i}`;
                    const gallery = document.getElementById(projectId);
                    
                    // 创建临时文件输入
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.multiple = true;
                    
                    // 触发文件选择
                    fileInput.click();
                    
                    // 处理文件选择
                    fileInput.addEventListener('change', function(e) {
                        const files = e.target.files;
                        if (files.length > 0) {
                            handleImageUpload(files, projectId, gallery);
                        }
                    });
                });
            }
        }
        
        // 为每个保存按钮添加事件监听器
        const saveButton = document.getElementById(`save-${i}`);
        if (saveButton) {
            saveButton.addEventListener('click', async function() {
                const projectId = `project-${i}`;
                const gallery = document.getElementById(projectId);
                const images = gallery.querySelectorAll('img');
                const totalImages = images.length;
                
                if (totalImages === 0) {
                    alert('没有图片需要保存');
                    return;
                }
                
                // 显示保存进度
                const progressText = document.createElement('span');
                progressText.className = 'save-progress';
                progressText.textContent = '保存中...';
                progressText.style.marginLeft = '10px';
                progressText.style.color = '#4CAF50';
                saveButton.parentNode.appendChild(progressText);
                
                // 按照实际图片数量保存并显示进度
                let savedImages = 0;
                const imagesData = [];
                
                function saveNextImage() {
                    if (savedImages < totalImages) {
                        const img = images[savedImages];
                        imagesData.push(img.src);
                        savedImages++;
                        
                        const progress = Math.round((savedImages / totalImages) * 100);
                        progressText.textContent = `保存中... ${progress}% (${savedImages}/${totalImages})`;
                        
                        // 模拟保存延迟，让用户能够看到进度变化
                        setTimeout(saveNextImage, 100);
                    } else {
                        // 保存所有图片数据到IndexedDB
                        imageStorage.saveImages(projectId, imagesData)
                            .then(() => {
                                progressText.textContent = '保存完成';
                                setTimeout(() => {
                                    progressText.remove();
                                }, 2000);
                            })
                            .catch((error) => {
                                console.error('保存失败:', error);
                                progressText.textContent = '保存失败';
                                setTimeout(() => {
                                    progressText.remove();
                                }, 2000);
                            });
                    }
                }
                
                // 开始保存图片
                saveNextImage();
            });
        }
    }
    
    // 加载保存的图片
    loadSavedImages();
    
    // 初始化ComfUI图片上传
    initComfUIImageUpload();
}

// ComfUI图片上传和保存功能
function initComfUIImageUpload() {
    const uploadInput = document.getElementById('upload-comfui');
    const saveButton = document.getElementById('save-comfui');
    const gallery = document.getElementById('comfui-gallery');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 100) {
                alert('最多只能上传100张图片');
                return;
            }
            
            handleImageUpload(files, 'comfui-gallery', gallery);
        });
    }
    
    // 为ComfUI添加图片按钮添加事件监听器
    const addButton = document.getElementById('add-comfui');
    if (addButton) {
        addButton.addEventListener('click', function() {
            const gallery = document.getElementById('comfui-gallery');
            
            // 创建临时文件输入
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            
            // 触发文件选择
            fileInput.click();
            
            // 处理文件选择
            fileInput.addEventListener('change', function(e) {
                const files = e.target.files;
                if (files.length > 0) {
                    handleImageUpload(files, 'comfui-gallery', gallery);
                }
            });
        });
    }
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const gallery = document.getElementById('comfui-gallery');
            const images = gallery.querySelectorAll('img');
            const totalImages = images.length;
            
            if (totalImages === 0) {
                alert('没有图片需要保存');
                return;
            }
            
            // 显示保存进度
            const progressText = document.createElement('span');
            progressText.className = 'save-progress';
            progressText.textContent = '保存中...';
            progressText.style.marginLeft = '10px';
            progressText.style.color = '#4CAF50';
            saveButton.parentNode.appendChild(progressText);
            
            // 按照实际图片数量保存并显示进度
            let savedImages = 0;
            const imagesData = [];
            
            function saveNextImage() {
                if (savedImages < totalImages) {
                    const img = images[savedImages];
                    imagesData.push(img.src);
                    savedImages++;
                    
                    const progress = Math.round((savedImages / totalImages) * 100);
                    progressText.textContent = `保存中... ${progress}% (${savedImages}/${totalImages})`;
                    
                    // 模拟保存延迟，让用户能够看到进度变化
                    setTimeout(saveNextImage, 100);
                } else {
                    // 保存所有图片数据到IndexedDB
                    imageStorage.saveImages('comfui-gallery', imagesData)
                        .then(() => {
                            progressText.textContent = '保存完成';
                            setTimeout(() => {
                                progressText.remove();
                            }, 2000);
                        })
                        .catch((error) => {
                            console.error('保存失败:', error);
                            progressText.textContent = '保存失败';
                            setTimeout(() => {
                                progressText.remove();
                            }, 2000);
                        });
                }
            }
            
            // 开始保存图片
            saveNextImage();
        });
    }
    
    // 加载保存的ComfUI图片
    loadSavedComfUIImages();
}



// 加载保存的ComfUI图片
async function loadSavedComfUIImages() {
    const gallery = document.getElementById('comfui-gallery');
    
    if (gallery) {
        try {
            const images = await imageStorage.getImages('comfui-gallery');
            
            gallery.innerHTML = '';
            
            images.forEach((imgData, index) => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                
                const img = document.createElement('img');
                img.src = imgData;
                img.alt = `ComfUI图片 ${index + 1}`;
                img.className = 'gallery-image';
                
                // 添加删除按钮
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-button';
                removeButton.innerHTML = '&times;';
                removeButton.addEventListener('click', function() {
                    galleryItem.remove();
                    // 更新保存的图片
                    updateSavedImages('comfui-gallery');
                    // 更新+按钮位置
                    updateAddButtons();
                });
                
                // 添加长按拖动功能
                addDragFunctionality(galleryItem, 'comfui-gallery');
                
                galleryItem.appendChild(img);
                galleryItem.appendChild(removeButton);
                gallery.appendChild(galleryItem);
            });
            
            // 为加载的图片添加交互功能
            setupImageInteractions();
            
            // 添加+按钮
            addAddButton(gallery, 'comfui-gallery');
        } catch (error) {
            console.error('加载图片失败:', error);
        }
    }
}

// 处理图片上传
async function handleImageUpload(files, projectId, gallery) {
    // 先加载现有的图片数据
    let existingImages = [];
    try {
        existingImages = await imageStorage.getImages(projectId);
    } catch (error) {
        console.error('加载现有图片失败:', error);
    }
    
    const newImages = [];
    
    // 处理每个文件
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const imgData = e.target.result;
            newImages.push(imgData);
            
            // 创建图片元素
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = imgData;
            img.alt = `图片 ${existingImages.length + index + 1}`;
            img.className = 'gallery-image';
            
            // 添加删除按钮
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.innerHTML = '&times;';
            removeButton.addEventListener('click', function() {
                galleryItem.remove();
                // 更新保存的图片
                updateSavedImages(projectId);
                // 更新+按钮位置
                updateAddButtons();
            });
            
            // 添加长按拖动功能
            addDragFunctionality(galleryItem, projectId);
            
            galleryItem.appendChild(img);
            galleryItem.appendChild(removeButton);
            gallery.appendChild(galleryItem);
            
            // 为新添加的图片添加交互功能
            setupImageInteractions();
            
            // 当所有图片都处理完成后，保存到IndexedDB并更新+按钮
            if (index === files.length - 1) {
                // 合并现有图片和新图片
                const allImages = [...existingImages, ...newImages];
                
                try {
                    await imageStorage.saveImages(projectId, allImages);
                    console.log('图片上传成功:', projectId);
                } catch (error) {
                    console.error('保存图片失败:', error);
                    alert('图片保存失败，请重试。');
                }
                
                // 更新+按钮位置
                updateAddButtons();
            }
        };
        
        reader.readAsDataURL(file);
    });
}

// 更新所有+按钮位置
function updateAddButtons() {
    // 为每个项目画廊添加+按钮
    for (let i = 1; i <= 6; i++) {
        const projectId = `project-${i}`;
        const gallery = document.getElementById(projectId);
        if (gallery) {
            addAddButton(gallery, projectId);
        }
    }
    
    // 为ComfUI画廊添加+按钮
    const comfuiGallery = document.getElementById('comfui-gallery');
    if (comfuiGallery) {
        addAddButton(comfuiGallery, 'comfui-gallery');
    }
}

// 添加+按钮到画廊
function addAddButton(gallery, projectId) {
    // 移除现有的+按钮
    const existingAddButton = gallery.querySelector('.add-button-container');
    if (existingAddButton) {
        existingAddButton.remove();
    }
    
    // 创建+按钮容器
    const addButtonContainer = document.createElement('div');
    addButtonContainer.className = 'add-button-container';
    
    // 创建+按钮
    const addButton = document.createElement('button');
    addButton.className = 'add-button';
    addButton.innerHTML = '+';
    
    // 添加点击事件，打开文件选择器
    addButton.addEventListener('click', function() {
        // 创建临时文件输入
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        
        // 触发文件选择
        fileInput.click();
        
        // 处理文件选择
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                handleImageUpload(files, projectId, gallery);
            }
        });
    });
    
    addButtonContainer.appendChild(addButton);
    gallery.appendChild(addButtonContainer);
}

// 添加长按拖动功能
function addDragFunctionality(galleryItem, projectId) {
    let isDragging = false;
    let startX, startY, offsetX, offsetY;
    let longPressTimer;
    
    // 鼠标按下事件
    galleryItem.addEventListener('mousedown', function(e) {
        // 开始长按计时
        longPressTimer = setTimeout(() => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // 计算偏移量
            const rect = galleryItem.getBoundingClientRect();
            offsetX = startX - rect.left;
            offsetY = startY - rect.top;
            
            // 添加拖动样式
            galleryItem.style.position = 'absolute';
            galleryItem.style.zIndex = '1000';
            galleryItem.style.cursor = 'grabbing';
        }, 1000); // 1秒长按
    });
    
    // 鼠标移动事件
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            e.preventDefault();
            
            // 计算新位置
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            
            // 设置新位置
            galleryItem.style.left = newX + 'px';
            galleryItem.style.top = newY + 'px';
        }
    });
    
    // 鼠标释放事件
    document.addEventListener('mouseup', function() {
        clearTimeout(longPressTimer);
        
        if (isDragging) {
            isDragging = false;
            
            // 重置样式
            galleryItem.style.position = '';
            galleryItem.style.zIndex = '';
            galleryItem.style.cursor = '';
            galleryItem.style.left = '';
            galleryItem.style.top = '';
            
            // 更新保存的图片顺序
            updateSavedImages(projectId);
        }
    });
    
    // 触摸事件支持
    galleryItem.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        longPressTimer = setTimeout(() => {
            isDragging = true;
            startX = touch.clientX;
            startY = touch.clientY;
            
            const rect = galleryItem.getBoundingClientRect();
            offsetX = startX - rect.left;
            offsetY = startY - rect.top;
            
            galleryItem.style.position = 'absolute';
            galleryItem.style.zIndex = '1000';
            galleryItem.style.cursor = 'grabbing';
        }, 1000);
    });
    
    galleryItem.addEventListener('touchmove', function(e) {
        if (isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const newX = touch.clientX - offsetX;
            const newY = touch.clientY - offsetY;
            
            galleryItem.style.left = newX + 'px';
            galleryItem.style.top = newY + 'px';
        }
    });
    
    galleryItem.addEventListener('touchend', function() {
        clearTimeout(longPressTimer);
        
        if (isDragging) {
            isDragging = false;
            galleryItem.style.position = '';
            galleryItem.style.zIndex = '';
            galleryItem.style.cursor = '';
            galleryItem.style.left = '';
            galleryItem.style.top = '';
            
            updateSavedImages(projectId);
        }
    });
}

// 加载保存的ComfUI图片
async function loadSavedComfUIImages() {
    const gallery = document.getElementById('comfui-gallery');
    
    if (gallery) {
        try {
            const images = await imageStorage.getImages('comfui-gallery');
            
            gallery.innerHTML = '';
            
            images.forEach((imgData, index) => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                
                const img = document.createElement('img');
                img.src = imgData;
                img.alt = `ComfUI图片 ${index + 1}`;
                img.className = 'gallery-image';
                
                // 添加删除按钮
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-button';
                removeButton.innerHTML = '&times;';
                removeButton.addEventListener('click', function() {
                    galleryItem.remove();
                    // 更新保存的图片
                    updateSavedImages('comfui-gallery');
                    // 更新+按钮位置
                    updateAddButtons();
                });
                
                // 添加长按拖动功能
                addDragFunctionality(galleryItem, 'comfui-gallery');
                
                galleryItem.appendChild(img);
                galleryItem.appendChild(removeButton);
                gallery.appendChild(galleryItem);
            });
            
            // 为加载的图片添加交互功能
            setupImageInteractions();
            
            // 添加+按钮
            addAddButton(gallery, 'comfui-gallery');
        } catch (error) {
            console.error('加载图片失败:', error);
        }
    }
}

// 加载保存的图片
async function loadSavedImages() {
    for (let i = 1; i <= 3; i++) {
        const projectId = `project-${i}`;
        const gallery = document.getElementById(projectId);
        
        if (gallery) {
            try {
                const images = await imageStorage.getImages(projectId);
                
                gallery.innerHTML = '';
                
                images.forEach((imgData, index) => {
                    const galleryItem = document.createElement('div');
                    galleryItem.className = 'gallery-item';
                    
                    const img = document.createElement('img');
                    img.src = imgData;
                    img.alt = `图片 ${index + 1}`;
                    img.className = 'gallery-image';
                    
                    // 添加删除按钮
                    const removeButton = document.createElement('button');
                    removeButton.className = 'remove-button';
                    removeButton.innerHTML = '&times;';
                    removeButton.addEventListener('click', function() {
                        galleryItem.remove();
                        // 更新保存的图片
                        updateSavedImages(projectId);
                        // 更新+按钮位置
                        updateAddButtons();
                    });
                    
                    // 添加长按拖动功能
                    addDragFunctionality(galleryItem, projectId);
                    
                    galleryItem.appendChild(img);
                    galleryItem.appendChild(removeButton);
                    gallery.appendChild(galleryItem);
                });
                
                // 为加载的图片添加交互功能
                setupImageInteractions();
                
                // 添加+按钮
                addAddButton(gallery, projectId);
            } catch (error) {
                console.error('加载图片失败:', error);
            }
        }
    }
}

// 更新保存的图片
async function updateSavedImages(projectId) {
    const gallery = document.getElementById(projectId);
    const images = [];
    
    gallery.querySelectorAll('img').forEach(img => {
        images.push(img.src);
    });
    
    try {
        await imageStorage.saveImages(projectId, images);
        console.log('图片更新成功:', projectId);
    } catch (error) {
        console.error('更新图片失败:', error);
    }
}

// 初始化图片交互
setupImageInteractions();

// 初始化图片上传功能
initImageUpload();

// PDF上传和保存功能
function initPDFUpload() {
    const uploadInput = document.getElementById('upload-pdf');
    const pdfViewer = document.getElementById('pdf-viewer');
    
    if (uploadInput && pdfViewer) {
        // 添加上传事件监听器
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const pdfData = e.target.result;
                    // 保存PDF数据到IndexedDB
                    imageStorage.saveImages('uploadedPDF', [pdfData])
                        .then(() => {
                            console.log('PDF保存成功');
                        })
                        .catch((error) => {
                            console.error('PDF保存失败:', error);
                        });
                    // 显示PDF
                    displayPDF(pdfData, pdfViewer);
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // 加载保存的PDF
        loadSavedPDF();
    }
}

// 显示PDF
function displayPDF(pdfData, pdfViewer) {
    pdfViewer.innerHTML = '';
    
    const iframe = document.createElement('iframe');
    iframe.src = pdfData;
    iframe.width = '100%';
    iframe.height = '500px';
    iframe.title = 'PDF预览';
    
    pdfViewer.appendChild(iframe);
}

// 加载保存的PDF
async function loadSavedPDF() {
    const pdfViewer = document.getElementById('pdf-viewer');
    
    if (pdfViewer) {
        try {
            const pdfData = await imageStorage.getImages('uploadedPDF');
            if (pdfData && pdfData.length > 0) {
                displayPDF(pdfData[0], pdfViewer);
            }
        } catch (error) {
            console.error('加载PDF失败:', error);
        }
    }
}

// 初始化PDF上传功能
initPDFUpload();

// 监听新添加的图片
const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains('gallery-item')) {
                setupImageInteractions();
            }
        });
    });
});

// 观察所有项目画廊
document.querySelectorAll('.project-gallery').forEach(gallery => {
    mutationObserver.observe(gallery, { childList: true, subtree: true });
});

// ===== Intersection Observer 用于触发动画 =====
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // 添加显示动画类
            entry.target.classList.add('revealed');
        }
    });
}, observerOptions);

// 观察所有需要动画的区域
document.querySelectorAll('.interior, .comfui').forEach(section => {
    intersectionObserver.observe(section);
});

// ===== 鼠标跟随效果（Hero区域）=====
const hero = document.querySelector('.hero');
const shapes = document.querySelectorAll('.shape');

if (hero && !window.matchMedia('(pointer: coarse)').matches) {
    hero.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        const xPos = (clientX / innerWidth - 0.5) * 20;
        const yPos = (clientY / innerHeight - 0.5) * 20;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            shape.style.transform = `translate(${xPos * speed}px, ${yPos * speed}px)`;
        });
    });
}

// ===== 打字机效果 =====
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// 为副标题添加打字机效果
const heroSubtitle = document.querySelector('.hero-subtitle');
if (heroSubtitle) {
    const originalText = heroSubtitle.textContent;
    
    // 使用 Intersection Observer 触发动画
    const subtitleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                typeWriter(heroSubtitle, originalText, 80);
                subtitleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    subtitleObserver.observe(heroSubtitle);
}

// ===== 视差滚动效果 =====
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    
    // Hero 区域视差
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
    }
});

// ===== 按钮点击波纹效果 =====
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            left: ${x}px;
            top: ${y}px;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// 添加波纹动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== 页面加载动画 =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // 触发初始动画
    setTimeout(() => {
        revealOnScroll();
    }, 100);
});

// ===== 返回顶部按钮 =====
const backToTopBtn = document.createElement('button');
backToTopBtn.innerHTML = '↑';
backToTopBtn.className = 'back-to-top';
backToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    z-index: 999;
`;

document.body.appendChild(backToTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.visibility = 'visible';
    } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.visibility = 'hidden';
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===== 图片懒加载 =====
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// ===== 键盘导航支持 =====
document.addEventListener('keydown', (e) => {
    // ESC 关闭移动端菜单
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// ===== 性能优化：防抖函数 =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖优化滚动事件
const optimizedScrollHandler = debounce(() => {
    revealOnScroll();
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

console.log('🎨 Portfolio website loaded successfully!');

// ===== 导出图片功能 =====
const exportBtn = document.getElementById('exportImages');
if (exportBtn) {
    exportBtn.addEventListener('click', async function() {
        const projects = ['project-1', 'project-2', 'project-3', 'comfui-gallery'];
        let totalImages = 0;
        let exportedImages = 0;
        
        // 显示导出进度
        const progressDiv = document.createElement('div');
        progressDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            font-family: 'Noto Sans SC', sans-serif;
        `;
        progressDiv.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #333;">正在导出图片...</h3>
            <div id="exportProgress" style="font-size: 18px; color: #6366f1; margin-bottom: 10px;">准备导出...</div>
            <div style="width: 300px; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                <div id="exportProgressBar" style="width: 0%; height: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); transition: width 0.3s;"></div>
            </div>
            <p style="margin-top: 15px; color: #6b7280; font-size: 14px;">请将导出的图片保存到对应的images文件夹中</p>
        `;
        document.body.appendChild(progressDiv);
        
        // 创建ZIP文件
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        
        for (const projectId of projects) {
            const images = await imageStorage.getImages(projectId);
            totalImages += images.length;
            
            const folderName = projectId === 'comfui-gallery' ? 'comfui' : projectId;
            const folder = zip.folder(folderName);
            
            for (let i = 0; i < images.length; i++) {
                const imgData = images[i];
                const base64Data = imgData.split(',')[1];
                const binaryData = atob(base64Data);
                const array = new Uint8Array(binaryData.length);
                
                for (let j = 0; j < binaryData.length; j++) {
                    array[j] = binaryData.charCodeAt(j);
                }
                
                folder.file(`image_${i + 1}.jpg`, array);
                exportedImages++;
                
                // 更新进度
                const progress = Math.round((exportedImages / totalImages) * 100);
                document.getElementById('exportProgress').textContent = `已导出 ${exportedImages}/${totalImages} 张图片`;
                document.getElementById('exportProgressBar').style.width = `${progress}%`;
            }
        }
        
        // 生成并下载ZIP文件
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-images.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 显示完成信息
        document.getElementById('exportProgress').textContent = '导出完成！';
        document.getElementById('exportProgressBar').style.width = '100%';
        
        setTimeout(() => {
            document.body.removeChild(progressDiv);
            alert('图片已导出！\n\n请将ZIP文件解压，将图片放入对应的images文件夹中，然后上传到GitHub。');
        }, 2000);
    });
}

// 加载JSZip库
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (window.JSZip) {
            resolve(window.JSZip);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
});
