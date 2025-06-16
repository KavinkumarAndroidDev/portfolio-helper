import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

// DOM Elements
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login');
const projectsSection = document.getElementById('projects');
const blogsSection = document.getElementById('blogs');
const authStatus = document.getElementById('auth-status');
const projectForm = document.getElementById('project-form');
const blogForm = document.getElementById('blog-form');
const projectFeaturesInput = document.getElementById('project-features');
const projectTechnologiesInput = document.getElementById('project-technologies');
const hasFeatureTextSelect = document.getElementById('has-feature-text');
const featureTextGroup = document.querySelector('.feature-text-group');
const featureTextInput = document.getElementById('feature-text');
const projectLinkType = document.getElementById('project-link-type');
const projectLink = document.getElementById('project-link');

// Initialize tags arrays
const featuresTags = [];
const technologiesTags = [];

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        projectsSection.style.display = 'block';
        blogsSection.style.display = 'block';
        showNotification('Welcome back!', 'success');
    } else {
        // User is signed out
        loginSection.style.display = 'block';
        projectsSection.style.display = 'none';
        blogsSection.style.display = 'none';
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
            authStatus.textContent = 'Invalid email or password';
            authStatus.className = 'auth-status error';
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

// Function to show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : '✕'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Add show class after a small delay for animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Image validation
function validateImage(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
    }

    if (file.size > maxSize) {
        throw new Error('Image size should be less than 5MB');
    }

    return true;
}

// Image preview functionality
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const fileName = document.getElementById(`${inputId}-name`);
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                validateImage(file);
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    preview.style.display = 'block';
                    fileName.textContent = file.name;
                }
                reader.readAsDataURL(file);
            } catch (error) {
                showNotification(error.message, 'error');
                input.value = ''; // Clear the file input
                preview.style.display = 'none';
                fileName.textContent = 'No file chosen';
            }
        } else {
            preview.style.display = 'none';
            fileName.textContent = 'No file chosen';
        }
    });
}

// Initialize image previews
setupImagePreview('project-image', 'project-image-preview');
setupImagePreview('blog-image', 'blog-image-preview');

// Upload image to Firebase Storage
async function uploadImage(file, path) {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Handle feature text visibility
if (hasFeatureTextSelect) {
    hasFeatureTextSelect.addEventListener('change', (e) => {
        featureTextGroup.style.display = e.target.value === 'yes' ? 'block' : 'none';
        if (e.target.value === 'yes') {
            featureTextInput.setAttribute('required', '');
        } else {
            featureTextInput.removeAttribute('required');
        }
    });
}

// Handle link type change
if (projectLinkType) {
    projectLinkType.addEventListener('change', (e) => {
        if (e.target.value === 'Not applicable') {
            projectLink.removeAttribute('required');
            projectLink.value = ''; // Clear the link field
        } else {
            projectLink.setAttribute('required', '');
        }
    });
}

// Handle project form submission
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Upload image first
            const imageFile = document.getElementById('project-image').files[0];
            if (!imageFile) {
                throw new Error('Please select an image');
            }

            const imagePath = `projects/${Date.now()}_${imageFile.name}`;
            const imageUrl = await uploadImage(imageFile, imagePath);

            // Clean up tags by removing extra spaces and 'x' characters
            const cleanTags = (tags) => {
                return tags.map(tag => {
                    // Get only the tag text, excluding the remove button
                    const tagText = tag.querySelector('.tag-text')?.textContent || tag;
                    return tagText.trim();
                }).filter(tag => tag.length > 0);
            };

            const projectData = {
                title: document.getElementById('project-title').value,
                category: document.getElementById('project-category').value,
                description: document.getElementById('project-description').value,
                features: cleanTags(Array.from(document.querySelectorAll('#project-features-tags .tag'))),
                technologies: cleanTags(Array.from(document.querySelectorAll('#project-technologies-tags .tag'))),
                linkType: document.getElementById('project-link-type').value,
                status: document.getElementById('project-status').value,
                image: imageUrl,
                timestamp: new Date().toISOString()
            };

            // Only add link if link type is not "Not applicable"
            if (projectLinkType.value !== 'Not applicable') {
                projectData.link = projectLink.value;
            }

            // Add feature text if it exists
            if (hasFeatureTextSelect.value === 'yes' && featureTextInput.value.trim()) {
                projectData.featureText = featureTextInput.value.trim();
            }

            await addDoc(collection(db, "projects"), projectData);
            showNotification('Project added successfully!', 'success');
            
            // Reset form and clear tags
            projectForm.reset();
            document.getElementById('project-features-tags').innerHTML = '';
            document.getElementById('project-technologies-tags').innerHTML = '';
            featureTextGroup.style.display = 'none';
            document.getElementById('project-image-preview').style.display = 'none';
        } catch (error) {
            console.error('Error adding project:', error);
            showNotification(error.message || 'Error adding project', 'error');
        }
    });
}

// Update blog form submission
blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const imageFile = document.getElementById('blog-image').files[0];
        if (!imageFile) {
            throw new Error('Please select an image');
        }

        // Upload image first
        const imagePath = `blogs/${Date.now()}_${imageFile.name}`;
        const imageUrl = await uploadImage(imageFile, imagePath);

        const blogData = {
            title: document.getElementById('blog-title').value,
            author: document.getElementById('blog-author').value,
            category: document.getElementById('blog-category').value,
            image: imageUrl,
            link: document.getElementById('blog-link').value
        };

        await addDoc(collection(db, "blogs"), blogData);
        showNotification('Blog added successfully!', 'success');
        blogForm.reset();
        document.getElementById('blog-image-preview').style.display = 'none';
    } catch (error) {
        console.error('Error adding blog:', error);
        showNotification(error.message || 'Error adding blog', 'error');
    }
});

// Handle tags input
function handleTagsInput(input, tagsArray, containerId) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value && !tagsArray.includes(value)) {
                tagsArray.push(value);
                updateTagsDisplay(containerId, tagsArray);
                input.value = '';
            }
        }
    });
}

// Update tags display
function updateTagsDisplay(containerId, tagsArray) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    tagsArray.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            <span class="tag-text">${tag}</span>
            <span class="remove-tag" data-index="${index}">×</span>
        `;
        container.appendChild(tagElement);
    });

    // Add click handlers for remove buttons
    container.querySelectorAll('.remove-tag').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index);
            tagsArray.splice(index, 1);
            updateTagsDisplay(containerId, tagsArray);
        });
    });
}

// Initialize tags input if elements exist
if (projectFeaturesInput) {
    handleTagsInput(projectFeaturesInput, featuresTags, 'project-features-tags');
}

if (projectTechnologiesInput) {
    handleTagsInput(projectTechnologiesInput, technologiesTags, 'project-technologies-tags');
}

// Smooth scrolling for anchor links
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