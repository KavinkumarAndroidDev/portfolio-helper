import { db, auth, storage } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

// DOM Elements
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login');
const managementSection = document.getElementById('management');
const projectsGrid = document.getElementById('projects-grid');
const blogsGrid = document.getElementById('blogs-grid');
const saveOrderBtn = document.getElementById('save-order-btn');
const saveBlogOrderBtn = document.getElementById('save-blog-order-btn');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModal = document.querySelector('.close-modal');

// Store current order
let projectsOrder = [];
let blogsOrder = [];

// Initialize drag and drop
function initializeDragAndDrop(grid) {
    const items = grid.querySelectorAll('.item-card');
    items.forEach(item => {
        item.setAttribute('draggable', true);
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
    });
}

// Drag and drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const siblings = [...e.target.parentNode.querySelectorAll('.item-card:not(.dragging)')];
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        return offset < 0;
    });
    e.target.parentNode.insertBefore(draggingItem, nextSibling);
}

function handleDrop(e) {
    e.preventDefault();
}

// Save order
async function saveOrder(type) {
    const grid = type === 'projects' ? projectsGrid : blogsGrid;
    const items = grid.querySelectorAll('.item-card');
    const newOrder = Array.from(items).map(item => item.id);
    
    try {
        const orderDoc = doc(db, 'settings', `${type}Order`);
        await setDoc(orderDoc, { orderedIds: newOrder });
        showNotification(`${type === 'projects' ? 'Projects' : 'Blogs'} order saved successfully!`, 'success');
    } catch (error) {
        console.error(`Error saving ${type} order:`, error);
        showNotification(`Error saving ${type} order`, 'error');
    }
}

// Load items with order
async function loadItemsWithOrder(type) {
    try {
        // Get order
        const orderDoc = doc(db, 'settings', `${type}Order`);
        const orderSnap = await getDoc(orderDoc);
        const orderedIds = orderSnap.exists() ? orderSnap.data().orderedIds : [];

        // Get all items
        const querySnapshot = await getDocs(collection(db, type));
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });

        // Clear and populate grid
        const grid = type === 'projects' ? projectsGrid : blogsGrid;
        const saveOrderBtn = type === 'projects' ? saveOrderBtn : saveBlogOrderBtn;
        grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = `<div class="no-items">No ${type} found. Add some ${type} to get started.</div>`;
            saveOrderBtn.classList.remove('visible');
            return;
        }

        // Show save order button when there are items
        saveOrderBtn.classList.add('visible');

        // Sort items according to order
        const sortedItems = orderedIds.length > 0
            ? orderedIds
                .map(id => items.find(item => item.id === id))
                .filter(Boolean)
                .concat(items.filter(item => !orderedIds.includes(item.id)))
            : items;
        
        sortedItems.forEach((item, index) => {
            const card = type === 'projects' 
                ? createProjectCard(item.id, item)
                : createBlogCard(item.id, item);
            card.querySelector('.order-number').textContent = index + 1;
            grid.appendChild(card);
        });

        // Initialize drag and drop
        initializeDragAndDrop(grid);
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        const grid = type === 'projects' ? projectsGrid : blogsGrid;
        const saveOrderBtn = type === 'projects' ? saveOrderBtn : saveBlogOrderBtn;
        grid.innerHTML = `<div class="error-message">Error loading ${type}. Please try again later.</div>`;
        saveOrderBtn.classList.remove('visible');
    }
}

// Event Listeners
if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => saveOrder('projects'));
}

if (saveBlogOrderBtn) {
    saveBlogOrderBtn.addEventListener('click', () => saveOrder('blogs'));
}

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.style.display = 'none';
        managementSection.style.display = 'block';
        loadItemsWithOrder('projects');
        loadItemsWithOrder('blogs');
    } else {
        loginSection.style.display = 'block';
        managementSection.style.display = 'none';
    }
});

// Handle login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showNotification('Login successful!', 'success');
            loginForm.reset();
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Invalid email or password', 'error');
        }
    });
}

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Error logging out', 'error');
        }
    });
}

// Load projects
async function loadProjects() {
    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        projectsGrid.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const card = createProjectCard(doc.id, project);
            projectsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Error loading projects', 'error');
    }
}

// Load blogs
async function loadBlogs() {
    try {
        const querySnapshot = await getDocs(collection(db, "blogs"));
        blogsGrid.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const blog = doc.data();
            const card = createBlogCard(doc.id, blog);
            blogsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading blogs:', error);
        showNotification('Error loading blogs', 'error');
    }
}

// Create project card
function createProjectCard(id, project) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = id;
    card.innerHTML = `
        <div class="order-number">1</div>
        <div class="drag-handle">⋮⋮</div>
        <img src="${project.image}" alt="${project.title}" class="item-image">
        <div class="item-content">
            <h4 class="item-title">${project.title}</h4>
            <span class="item-category">${project.category}</span>
            <p>${project.description}</p>
            <div class="item-actions">
                <button class="btn-edit" data-id="${id}">Edit</button>
                <button class="btn-delete" data-id="${id}">Delete</button>
            </div>
        </div>
    `;

    // Add event listeners
    const editBtn = card.querySelector('.btn-edit');
    const deleteBtn = card.querySelector('.btn-delete');

    editBtn.addEventListener('click', () => editProject(id));
    deleteBtn.addEventListener('click', () => deleteProject(id));

    return card;
}

// Create blog card
function createBlogCard(id, blog) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = id;
    card.innerHTML = `
        <div class="order-number">1</div>
        <div class="drag-handle">⋮⋮</div>
        <img src="${blog.image}" alt="${blog.title}" class="item-image">
        <div class="item-content">
            <h4 class="item-title">${blog.title}</h4>
            <span class="item-category">${blog.category}</span>
            <p>By ${blog.author}</p>
            <div class="item-actions">
                <button class="btn-edit" data-id="${id}">Edit</button>
                <button class="btn-delete" data-id="${id}">Delete</button>
            </div>
        </div>
    `;

    // Add event listeners
    const editBtn = card.querySelector('.btn-edit');
    const deleteBtn = card.querySelector('.btn-delete');

    editBtn.addEventListener('click', () => editBlog(id));
    deleteBtn.addEventListener('click', () => deleteBlog(id));

    return card;
}

// Edit project
async function editProject(id) {
    try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const project = docSnap.data();
            showEditModal('project', id, project);
        }
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Error loading project', 'error');
    }
}

// Edit blog
async function editBlog(id) {
    try {
        const docRef = doc(db, "blogs", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const blog = docSnap.data();
            showEditModal('blog', id, blog);
        }
    } catch (error) {
        console.error('Error loading blog:', error);
        showNotification('Error loading blog', 'error');
    }
}

// Show edit modal
function showEditModal(type, id, data) {
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = `Edit ${type === 'project' ? 'Project' : 'Blog'}`;
    
    editForm.innerHTML = generateEditForm(type, data);
    editForm.onsubmit = (e) => handleEditSubmit(e, type, id);
    
    editModal.classList.add('show');
}

// Generate edit form
function generateEditForm(type, data) {
    if (type === 'project') {
        return `
            <div class="form-group">
                <label for="edit-title">Title</label>
                <input type="text" id="edit-title" value="${data.title}" required>
            </div>
            <div class="form-group">
                <label for="edit-category">Category</label>
                <select id="edit-category" required>
                    <option value="App" ${data.category === 'App' ? 'selected' : ''}>App</option>
                    <option value="Website" ${data.category === 'Website' ? 'selected' : ''}>Website</option>
                    <option value="Cloud" ${data.category === 'Cloud' ? 'selected' : ''}>Cloud</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-description">Description</label>
                <textarea id="edit-description" required>${data.description}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-link">Link</label>
                <input type="url" id="edit-link" value="${data.link}" required>
            </div>
            <div class="form-group">
                <label for="edit-status">Status</label>
                <select id="edit-status" required>
                    <option value="Completed" ${data.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="In Progress" ${data.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Planned" ${data.status === 'Planned' ? 'selected' : ''}>Planned</option>
                </select>
            </div>
            <button type="submit" class="btn">Save Changes</button>
        `;
    } else {
        return `
            <div class="form-group">
                <label for="edit-title">Title</label>
                <input type="text" id="edit-title" value="${data.title}" required>
            </div>
            <div class="form-group">
                <label for="edit-author">Author</label>
                <input type="text" id="edit-author" value="${data.author}" required>
            </div>
            <div class="form-group">
                <label for="edit-category">Category</label>
                <input type="text" id="edit-category" value="${data.category}" required>
            </div>
            <div class="form-group">
                <label for="edit-link">Link</label>
                <input type="url" id="edit-link" value="${data.link}" required>
            </div>
            <button type="submit" class="btn">Save Changes</button>
        `;
    }
}

// Handle edit submit
async function handleEditSubmit(e, type, id) {
    e.preventDefault();
    
    try {
        const data = {
            title: document.getElementById('edit-title').value,
            category: document.getElementById('edit-category').value,
            link: document.getElementById('edit-link').value,
        };

        if (type === 'project') {
            data.description = document.getElementById('edit-description').value;
            data.status = document.getElementById('edit-status').value;
        } else {
            data.author = document.getElementById('edit-author').value;
        }

        const docRef = doc(db, type + 's', id);
        await updateDoc(docRef, data);
        
        showNotification(`${type === 'project' ? 'Project' : 'Blog'} updated successfully!`, 'success');
        editModal.classList.remove('show');
        
        if (type === 'project') {
            loadItemsWithOrder('projects');
        } else {
            loadItemsWithOrder('blogs');
        }
    } catch (error) {
        console.error(`Error updating ${type}:`, error);
        showNotification(`Error updating ${type}`, 'error');
    }
}

// Delete project
async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            const docRef = doc(db, "projects", id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const project = docSnap.data();
                
                // Delete image from storage
                const imageRef = ref(storage, project.image);
                await deleteObject(imageRef);
                
                // Delete document
                await deleteDoc(docRef);
                
                showNotification('Project deleted successfully!', 'success');
                loadItemsWithOrder('projects');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            showNotification('Error deleting project', 'error');
        }
    }
}

// Delete blog
async function deleteBlog(id) {
    if (confirm('Are you sure you want to delete this blog?')) {
        try {
            const docRef = doc(db, "blogs", id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const blog = docSnap.data();
                
                // Delete image from storage
                const imageRef = ref(storage, blog.image);
                await deleteObject(imageRef);
                
                // Delete document
                await deleteDoc(docRef);
                
                showNotification('Blog deleted successfully!', 'success');
                loadItemsWithOrder('blogs');
            }
        } catch (error) {
            console.error('Error deleting blog:', error);
            showNotification('Error deleting blog', 'error');
        }
    }
}

// Close modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        editModal.classList.remove('show');
    });
}

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.classList.remove('show');
    }
});

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : '✕'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
} 