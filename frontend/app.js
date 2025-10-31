// Initialize Appwrite SDK
import { Client, Account, Databases, Storage, Functions, Query, ID } from 'https://esm.sh/appwrite@14.0.0';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('69029b9d003100941c6d');

// Admin User IDs (multiple admins supported)
const ADMIN_USER_IDS = ['6902b176001bb52c8229']; // Add more User IDs as needed

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

const DATABASE_ID = 'clearance_system';

// DOM elements
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const togglePasswordIcon = document.querySelector('.toggle-password');
const forgotLink = document.querySelector('.forgot-link');

// Student elements
const studentDashboard = document.getElementById('student-dashboard');
const uploadBtn = document.getElementById('upload-btn');
const downloadPdfBtn = document.getElementById('download-pdf');
const viewDocsBtn = document.getElementById('view-docs-btn');
const refreshStatusBtn = document.getElementById('refresh-status-btn');

// Officer elements
const officerDashboard = document.getElementById('officer-dashboard');
const clearanceRequests = document.getElementById('clearance-requests');
const refreshRequestsBtn = document.getElementById('refresh-requests-btn');
const viewAllRequestsBtn = document.getElementById('view-all-requests-btn');

// Admin elements
const adminDashboard = document.getElementById('admin-dashboard');
const createOfficerBtn = document.getElementById('create-officer-btn');
const createAdminBtn = document.getElementById('create-admin-btn');
const refreshStatsBtn = document.getElementById('refresh-stats-btn');
const viewOfficersBtn = document.getElementById('view-officers-btn');
const viewAdminsBtn = document.getElementById('view-admins-btn');

// PWA Install functionality
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can install the PWA
    showInstallButton();
});

window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed');
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('frontend/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Show install button
function showInstallButton() {
    const installBtn = document.getElementById('install-btn');
    installBtn.style.display = 'block';

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

// Initialize app
async function init() {
    try {
        const user = await account.get();
        showDashboard(user);
    } catch (error) {
        // Check if we should show install button
        if (deferredPrompt) {
            showInstallButton();
        } else {
            showAuth();
        }
    }
}

// Add loading states to buttons
function setLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Authentication
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    const errorDiv = document.getElementById('login-error');

    // Clear previous error
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Validation
    if (!email) {
        showLoginError('Please enter your email address.');
        return;
    }

    if (!password) {
        showLoginError('Please enter your password.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showLoginError('Please enter a valid email address.');
        return;
    }

    setLoading(loginBtn, true);
    loginBtn.dataset.originalText = 'Login';

    try {
        console.log('Attempting login with email:', email, 'password length:', password.length);
        await account.createEmailPasswordSession(email, password);
        console.log('Session created successfully');
        const user = await account.get();
        console.log('User retrieved:', user);

        // Handle remember me (store email in localStorage)
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        showDashboard(user);
    } catch (error) {
        console.error('Login error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error response:', error.response);

        let errorMessage = 'Login failed. Please try again.';

        if (error.message.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('User not found')) {
            errorMessage = 'Account not found. Please check your email or register first.';
        } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('User (role: guest) missing scope')) {
            errorMessage = 'Account requires email verification. Please check your email.';
        }

        showLoginError(errorMessage);
    } finally {
        setLoading(loginBtn, false);
    }
});

// Helper function to show login errors
function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        errorDiv.style.animation = '';
    }, 500);
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

// Forgot password functionality
function forgotPassword() {
    const email = document.getElementById('email').value.trim();

    if (!email) {
        showLoginError('Please enter your email address first.');
        return;
    }

    // In a real app, this would send a password reset email
    alert(`Password reset link sent to ${email}. Please check your email.`);
}

// Make functions globally available
// window.togglePassword = togglePassword; // No longer needed as we use event listeners
// window.forgotPassword = forgotPassword; // No longer needed as we use event listeners

// Save profile button
document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const name = document.getElementById('student-name').value.trim();
    const matric = document.getElementById('student-matric').value.trim();
    const department = document.getElementById('student-dept').value.trim();
    const user = await account.get();

    if (!name || !matric || !department) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        await databases.createDocument(DATABASE_ID, 'students', 'unique()', {
            userId: user.$id,
            name,
            matric,
            email: user.email,
            department,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        // Hide setup form and show other sections
        document.getElementById('student-setup').style.display = 'none';
        document.getElementById('upload-section').style.display = 'block';
        document.getElementById('documents-section').style.display = 'block';
        document.getElementById('status-section').style.display = 'block';

        // Show student info
        document.getElementById('student-info').innerHTML = `
            <p>Name: ${name}</p>
            <p>Matric: ${matric}</p>
            <p>Department: ${department}</p>
            <p>Status: <span class="status-pending">pending</span></p>
        `;

        alert('Profile saved successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile: ' + error.message);
    }
});

// Load remembered email on page load
window.addEventListener('load', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember-me').checked = true;
    }

    // Add event listeners for toggle password and forgot password
    if (togglePasswordIcon) {
        togglePasswordIcon.addEventListener('click', togglePassword);
    }
    if (forgotLink) {
        forgotLink.addEventListener('click', forgotPassword);
    }

    // Show/hide confirm password field based on register button focus
    const registerBtn = document.getElementById('register-btn');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');

    registerBtn.addEventListener('focus', () => {
        confirmPasswordGroup.style.display = 'block';
    });

    registerBtn.addEventListener('blur', () => {
        // Hide after a short delay to allow clicking on the field
        setTimeout(() => {
            if (!confirmPasswordGroup.contains(document.activeElement)) {
                confirmPasswordGroup.style.display = 'none';
            }
        }, 100);
    });

    // Keep confirm password visible when focused
    confirmPasswordGroup.addEventListener('focusin', () => {
        confirmPasswordGroup.style.display = 'block';
    });

    confirmPasswordGroup.addEventListener('focusout', (e) => {
        if (!confirmPasswordGroup.contains(e.relatedTarget) && !registerBtn.contains(e.relatedTarget)) {
            confirmPasswordGroup.style.display = 'none';
        }
    });

    // Add file input change listeners for green highlight
    const fileInputs = [
        'library-clearance',
        'hostel-clearance',
        'departmental-clearance',
        'faculty-clearance',
        'alumni-clearance',
        'bursary-clearance'
    ];

    fileInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    e.target.classList.add('file-selected');
                } else {
                    e.target.classList.remove('file-selected');
                }
            });
        }
    });
});

registerBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password') ? document.getElementById('confirm-password').value : password;
    const errorDiv = document.getElementById('login-error');

    // Clear previous error
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Validation
    if (!email) {
        showLoginError('Please enter your email address.');
        return;
    }

    if (!password) {
        showLoginError('Please enter your password.');
        return;
    }

    if (password !== confirmPassword) {
        showLoginError('Passwords do not match.');
        return;
    }

    if (password.length < 8) {
        showLoginError('Password must be at least 8 characters long.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showLoginError('Please enter a valid email address.');
        return;
    }

    setLoading(registerBtn, true);
    registerBtn.dataset.originalText = 'Register as Student';

    try {
        await account.create(ID.unique(), email, password);
        // Auto-login after registration
        await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        if (document.getElementById('confirm-password')) {
            document.getElementById('confirm-password').value = '';
        }
        // Show dashboard
        showDashboard(user);
    } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';

        if (error.message.includes('User already exists')) {
            errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password too weak')) {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        }

        showLoginError(errorMessage);
    } finally {
        setLoading(registerBtn, false);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await account.deleteSession('current');
        showAuth();
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

// Dashboard functions
async function showDashboard(user) {
    // Add exit animation to current dashboard
    const currentDashboard = document.querySelector('#dashboard > div[style*="display: block"]');
    if (currentDashboard) {
        currentDashboard.classList.add('dashboard-exit');
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    authSection.style.display = 'none';
    dashboard.style.display = 'block';

    // Check user role
    try {
        // Check if user is admin (hardcoded User IDs array)
        if (ADMIN_USER_IDS.includes(user.$id)) {
            showAdminDashboard();
            return;
        }

        // Check if user is admin in admins collection (with error handling)
        try {
            const adminCheck = await databases.listDocuments(DATABASE_ID, 'admins', [
                Query.equal('adminId', user.$id)
            ]);
            if (adminCheck.documents.length > 0) {
                showAdminDashboard();
                return;
            }
        } catch (error) {
            // Silently handle missing admins collection
            console.log('Admins collection not available, checking hardcoded admins only');
        }

        // Check if user is officer (with error handling)
        try {
            const officer = await databases.listDocuments(DATABASE_ID, 'officers', [
                Query.equal('officerId', user.$id)
            ]);

            if (officer.documents.length > 0) {
                showOfficerDashboard();
            } else {
                showStudentDashboard(user);
            }
        } catch (error) {
            // Officers collection not available, default to student
            console.log('Officers collection not available, defaulting to student dashboard');
            showStudentDashboard(user);
        }
    } catch (error) {
        console.log('Error checking user role, defaulting to student dashboard');
        showStudentDashboard(user);
    }
}

function showAuth() {
    authSection.style.display = 'block';
    dashboard.style.display = 'none';
    studentDashboard.style.display = 'none';
    officerDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
}

async function showStudentDashboard(user) {
    studentDashboard.style.display = 'block';
    officerDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
    studentDashboard.classList.add('dashboard-enter');

    // Load student info
    try {
        const student = await databases.listDocuments(DATABASE_ID, 'students', [
            Query.equal('userId', user.$id)
        ]);

        if (student.documents.length > 0) {
            const studentData = student.documents[0];
            document.getElementById('student-info').innerHTML = `
                <p>Name: ${studentData.name}</p>
                <p>Matric: ${studentData.matric}</p>
                <p>Department: ${studentData.department}</p>
                <p>Status: <span class="status-${studentData.status}">${studentData.status}</span></p>
            `;

            if (studentData.status === 'accepted') {
                downloadPdfBtn.style.display = 'block';
            }
        } else {
            // Show profile setup form
            document.getElementById('student-setup').style.display = 'block';
            document.getElementById('upload-section').style.display = 'none';
            document.getElementById('documents-section').style.display = 'none';
            document.getElementById('status-section').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

async function showOfficerDashboard() {
    studentDashboard.style.display = 'none';
    officerDashboard.style.display = 'block';
    adminDashboard.style.display = 'none';
    officerDashboard.classList.add('dashboard-enter');

    // Load clearance requests
    try {
        const clearances = await databases.listDocuments(DATABASE_ID, 'clearances', [
            Query.equal('status', 'pending')
        ]);

        clearanceRequests.innerHTML = '';
        clearances.documents.forEach((clearance, index) => {
            const item = document.createElement('div');
            item.className = 'clearance-item stagger-item';
            item.innerHTML = `
                <p><strong>${clearance.studentName}</strong> (${clearance.department})</p>
                <button onclick="approveClearance('${clearance.$id}')">Accept</button>
                <button onclick="rejectClearance('${clearance.$id}')">Reject</button>
            `;
            clearanceRequests.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading clearances:', error);
    }
}

async function showAdminDashboard() {
    studentDashboard.style.display = 'none';
    officerDashboard.style.display = 'none';
    adminDashboard.style.display = 'block';
    adminDashboard.classList.add('dashboard-enter');

    // Load stats
    try {
        const clearances = await databases.listDocuments(DATABASE_ID, 'clearances');
        const officers = await databases.listDocuments(DATABASE_ID, 'officers');
        const students = await databases.listDocuments(DATABASE_ID, 'students');

        document.getElementById('stats').innerHTML = `
            <p class="stat-item">Total Students: ${students.total}</p>
            <p class="stat-item">Total Officers: ${officers.total}</p>
            <p class="stat-item">Total Clearances: ${clearances.total}</p>
            <p class="stat-item">Pending: ${clearances.documents.filter(c => c.status === 'pending').length}</p>
            <p class="stat-item">Accepted: ${clearances.documents.filter(c => c.status === 'accepted').length}</p>
            <p class="stat-item">Rejected: ${clearances.documents.filter(c => c.status === 'rejected').length}</p>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// File validation utilities
const FILE_VALIDATION = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
};

function validateFile(file, fileName) {
    if (!file) return { valid: true }; // Optional files

    // Check file size
    if (file.size > FILE_VALIDATION.maxSize) {
        return {
            valid: false,
            error: `${fileName}: File size exceeds 10MB limit. Please choose a smaller file.`
        };
    }

    // Check file type
    if (!FILE_VALIDATION.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `${fileName}: Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.`
        };
    }

    // Check file extension as backup
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!FILE_VALIDATION.allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `${fileName}: Invalid file extension. Only PDF, JPG, JPEG, and PNG files are allowed.`
        };
    }

    return { valid: true };
}

function getUserFriendlyError(error) {
    const errorMessage = error.message || error.toString();

    // Network errors
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        return 'Network connection error. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
        return 'Authentication failed. Please log out and log back in.';
    }

    // Storage quota errors
    if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
        return 'Storage limit exceeded. Please contact support or try uploading smaller files.';
    }

    // File corruption or invalid file errors
    if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
        return 'File appears to be corrupted or invalid. Please check the file and try again.';
    }

    // Rate limiting
    if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
        return 'Too many requests. Please wait a moment and try again.';
    }

    // Generic fallback
    return 'Upload failed due to an unexpected error. Please try again or contact support if the problem persists.';
}

async function uploadFileWithRetry(file, fileName, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Uploading ${fileName} (attempt ${attempt}/${maxRetries})`);
            const result = await storage.createFile('clearance_docs', 'unique()', file);
            return { success: true, fileId: result.$id };
        } catch (error) {
            console.error(`Upload attempt ${attempt} failed for ${fileName}:`, error);
            lastError = error;

            // Don't retry on certain errors
            if (error.message.includes('unauthorized') ||
                error.message.includes('forbidden') ||
                error.message.includes('quota') ||
                error.message.includes('storage')) {
                break;
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return {
        success: false,
        error: getUserFriendlyError(lastError),
        fileName
    };
}

// Upload documents with comprehensive error handling
uploadBtn.addEventListener('click', async () => {
    const files = {
        library: document.getElementById('library-clearance').files[0],
        hostel: document.getElementById('hostel-clearance').files[0],
        departmental: document.getElementById('departmental-clearance').files[0],
        faculty: document.getElementById('faculty-clearance').files[0],
        alumni: document.getElementById('alumni-clearance').files[0],
        bursary: document.getElementById('bursary-clearance').files[0]
    };

    const fileNames = {
        library: 'Library Clearance',
        hostel: 'Hostel Clearance',
        departmental: 'Departmental Clearance',
        faculty: 'Faculty Clearance',
        alumni: 'Alumni Office Clearance',
        bursary: 'Bursary Clearance'
    };

    // Validate required documents
    const requiredFiles = ['library', 'departmental', 'faculty', 'alumni', 'bursary'];
    const missingFiles = requiredFiles.filter(key => !files[key]);

    if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(key => fileNames[key]).join(', ');
        alert(`Please upload all required clearance documents: ${missingNames}. Hostel clearance is optional.`);
        return;
    }

    // Validate all files
    const validationErrors = [];
    for (const [key, file] of Object.entries(files)) {
        const validation = validateFile(file, fileNames[key]);
        if (!validation.valid) {
            validationErrors.push(validation.error);
        }
    }

    if (validationErrors.length > 0) {
        alert('File validation failed:\n\n' + validationErrors.join('\n'));
        return;
    }

    // Set loading state
    setLoading(uploadBtn, true);
    uploadBtn.dataset.originalText = 'Upload Documents';

    try {
        const uploadResults = {};
        const errors = [];
        let successCount = 0;

        // Upload files with progress tracking
        const uploadPromises = Object.entries(files)
            .filter(([key, file]) => file) // Only upload provided files
            .map(async ([key, file]) => {
                const result = await uploadFileWithRetry(file, fileNames[key]);
                if (result.success) {
                    uploadResults[key] = result.fileId;
                    successCount++;
                    console.log(`${fileNames[key]} uploaded successfully`);
                } else {
                    errors.push(result.error);
                    console.error(`${fileNames[key]} upload failed: ${result.error}`);
                }
            });

        // Wait for all uploads to complete
        await Promise.allSettled(uploadPromises);

        // Check if we have minimum required uploads
        const requiredUploads = ['library', 'departmental', 'faculty', 'alumni', 'bursary'];
        const successfulRequired = requiredUploads.filter(key => uploadResults[key]);

        if (successfulRequired.length < requiredUploads.length) {
            // Some required files failed
            const failedRequired = requiredUploads.filter(key => !uploadResults[key]);
            const failedNames = failedRequired.map(key => fileNames[key]).join(', ');

            let errorMessage = `Upload completed with issues:\n\n`;
            errorMessage += `Successfully uploaded: ${successCount} file(s)\n`;
            errorMessage += `Failed uploads: ${failedNames}\n\n`;
            errorMessage += `Errors:\n${errors.join('\n')}\n\n`;
            errorMessage += `Please try uploading the failed files again.`;

            alert(errorMessage);
            setLoading(uploadBtn, false);
            return;
        }

        // All required files uploaded successfully
        try {
            // Get student data
            const user = await account.get();
            const student = await databases.listDocuments(DATABASE_ID, 'students', [
                Query.equal('userId', user.$id)
            ]);
            const studentData = student.documents[0];

            // Create clearance record
            await databases.createDocument(DATABASE_ID, 'clearances', 'unique()', {
                studentId: user.$id,
                studentName: studentData.name,
                department: studentData.department,
                docs: JSON.stringify(uploadResults),
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Success message with uploaded files list
            let successMessage = 'All clearance documents uploaded successfully!\n\nUploaded files:';
            const uploadedFiles = Object.keys(uploadResults).filter(key => uploadResults[key]);
            uploadedFiles.forEach(key => {
                successMessage += `\n✓ ${fileNames[key]}`;
            });

            if (errors.length > 0) {
                successMessage += `\n\nNote: Some optional files had issues but were skipped.`;
            }
            alert(successMessage);

            // Show uploaded files in UI
            showUploadedFiles(uploadResults, fileNames);

            // Clear file inputs
            Object.keys(files).forEach(key => {
                const input = document.getElementById(`${key}-clearance`);
                if (input) input.value = '';
            });

        } catch (dbError) {
            console.error('Database error:', dbError);
            alert('Files uploaded successfully, but there was an issue saving your clearance request. Please contact support.');
        }

    } catch (error) {
        console.error('Unexpected upload error:', error);
        alert('An unexpected error occurred during upload. Please try again or contact support.');
    } finally {
        setLoading(uploadBtn, false);
    }
});

// Create officer
createOfficerBtn.addEventListener('click', async () => {
    const name = document.getElementById('officer-name').value;
    const email = document.getElementById('officer-email').value;
    const department = document.getElementById('officer-dept').value;
    const role = document.getElementById('officer-role').value;

    try {
        await functions.createExecution('create-officer', JSON.stringify({ name, email, department, role }));
        alert('Officer created successfully!');
        showAdminDashboard(); // Refresh stats
    } catch (error) {
        alert('Failed to create officer: ' + error.message);
    }
});

// Create admin
createAdminBtn.addEventListener('click', async () => {
    const name = document.getElementById('admin-name').value;
    const email = document.getElementById('admin-email').value;

    try {
        // Create user account
        const user = await account.create('unique()', email, 'TempPass123!'); // Temporary password
        const userId = user.$id;

        // Create admin record
        await databases.createDocument(DATABASE_ID, 'admins', 'unique()', {
            adminId: userId,
            name,
            email,
            createdAt: new Date().toISOString()
        });

        alert('Admin created successfully! User will need to reset password on first login.');
        showAdminDashboard(); // Refresh stats
    } catch (error) {
        alert('Failed to create admin: ' + error.message);
    }
});

// Approve/Reject clearance
window.approveClearance = async (clearanceId) => {
    try {
        await databases.updateDocument(DATABASE_ID, 'clearances', clearanceId, {
            status: 'accepted',
            updatedAt: new Date().toISOString()
        });

        // Send notification
        const clearance = await databases.getDocument(DATABASE_ID, 'clearances', clearanceId);
        const student = await databases.getDocument(DATABASE_ID, 'students', clearance.studentId);
        await functions.createExecution('notify-student', JSON.stringify({
            studentEmail: student.email,
            studentName: clearance.studentName,
            status: 'accepted'
        }));

        showOfficerDashboard(); // Refresh list
    } catch (error) {
        alert('Failed to approve clearance: ' + error.message);
    }
};

window.rejectClearance = async (clearanceId) => {
    const remarks = prompt('Enter rejection remarks:');
    if (!remarks) return;

    try {
        await databases.updateDocument(DATABASE_ID, 'clearances', clearanceId, {
            status: 'rejected',
            remarks,
            updatedAt: new Date().toISOString()
        });

        // Send notification
        const clearance = await databases.getDocument(DATABASE_ID, 'clearances', clearanceId);
        const student = await databases.getDocument(DATABASE_ID, 'students', clearance.studentId);
        await functions.createExecution('notify-student', JSON.stringify({
            studentEmail: student.email,
            studentName: clearance.studentName,
            status: 'rejected',
            remarks
        }));

        showOfficerDashboard(); // Refresh list
    } catch (error) {
        alert('Failed to reject clearance: ' + error.message);
    }
};

// Download PDF
downloadPdfBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Get student data
    const user = await account.get();
    const student = await databases.listDocuments(DATABASE_ID, 'students', [
        Query.equal('userId', user.$id)
    ]);

    if (student.documents.length > 0) {
        const studentData = student.documents[0];

        doc.text('CLEARANCE CERTIFICATE', 105, 20, { align: 'center' });
        doc.text(`Name: ${studentData.name}`, 20, 40);
        doc.text(`Matric Number: ${studentData.matric}`, 20, 50);
        doc.text(`Department: ${studentData.department}`, 20, 60);
        doc.text(`Approval Date: ${new Date().toLocaleDateString()}`, 20, 70);

        // Add passport photo (simplified)
        doc.text('Passport Photo: [Embedded Image]', 20, 90);

        doc.save('clearance_certificate.pdf');
    }
});

// View uploaded documents
viewDocsBtn.addEventListener('click', async () => {
    const documentsList = document.getElementById('documents-list');
    const user = await account.get();

    try {
        const clearances = await databases.listDocuments(DATABASE_ID, 'clearances', [
            Query.equal('studentId', user.$id)
        ]);

        if (clearances.documents.length > 0) {
            const clearance = clearances.documents[0];
            const docIds = JSON.parse(clearance.docs || '{}');

            documentsList.innerHTML = '<h4>Uploaded Clearance Documents:</h4>';

            const documentTypes = {
                library: 'Library Clearance',
                departmental: 'Departmental Clearance',
                faculty: 'Faculty Clearance',
                alumni: 'Alumni Office Clearance',
                bursary: 'Bursary Clearance',
                hostel: 'Hostel Clearance'
            };

            let hasDocuments = false;
            for (const [key, docId] of Object.entries(docIds)) {
                if (docId) {
                    try {
                        const file = await storage.getFile('clearance_docs', docId);
                        documentsList.innerHTML += `<p><strong>${documentTypes[key]}:</strong> <a href="${storage.getFileView('clearance_docs', docId)}" target="_blank">${file.name}</a></p>`;
                        hasDocuments = true;
                    } catch (error) {
                        console.error(`Error loading ${key} document:`, error);
                        documentsList.innerHTML += `<p><strong>${documentTypes[key]}:</strong> <span style="color: red;">Error loading document</span></p>`;
                    }
                }
            }

            if (!hasDocuments) {
                documentsList.innerHTML += '<p>No documents uploaded yet.</p>';
            }
        } else {
            documentsList.innerHTML = '<p>No clearance request found.</p>';
        }

        documentsList.style.display = documentsList.style.display === 'none' ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading documents:', error);
        alert('Failed to load documents.');
    }
});

// Refresh status
refreshStatusBtn.addEventListener('click', async () => {
    const user = await account.get();
    await showStudentDashboard(user);
    alert('Status refreshed!');
});

// Refresh requests (Officer)
refreshRequestsBtn.addEventListener('click', async () => {
    await showOfficerDashboard();
    alert('Requests refreshed!');
});

// View all requests (Officer)
viewAllRequestsBtn.addEventListener('click', async () => {
    try {
        const clearances = await databases.listDocuments(DATABASE_ID, 'clearances');

        clearanceRequests.innerHTML = '<h4>All Clearance Requests:</h4>';
        clearances.documents.forEach(clearance => {
            const item = document.createElement('div');
            item.className = 'clearance-item';
            item.innerHTML = `
                <p><strong>${clearance.studentName}</strong> (${clearance.department})</p>
                <p>Status: <span class="status-${clearance.status}">${clearance.status}</span></p>
                ${clearance.status === 'pending' ? '<button onclick="approveClearance(\'' + clearance.$id + '\')">Accept</button><button onclick="rejectClearance(\'' + clearance.$id + '\')">Reject</button>' : ''}
            `;
            clearanceRequests.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading all requests:', error);
        alert('Failed to load all requests.');
    }
});

// Refresh stats (Admin)
refreshStatsBtn.addEventListener('click', async () => {
    await showAdminDashboard();
    alert('Statistics refreshed!');
});

// View all officers (Admin)
viewOfficersBtn.addEventListener('click', async () => {
    const officersList = document.getElementById('officers-list');

    try {
        const officers = await databases.listDocuments(DATABASE_ID, 'officers');

        officersList.innerHTML = '<h4>All Clearance Officers:</h4>';
        officers.documents.forEach(officer => {
            officersList.innerHTML += `
                <div class="officer-item">
                    <p><strong>${officer.name}</strong></p>
                    <p>Email: ${officer.email}</p>
                    <p>Department: ${officer.department}</p>
                    <p>Role: ${officer.role}</p>
                </div>
            `;
        });

        officersList.style.display = officersList.style.display === 'none' ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading officers:', error);
        alert('Failed to load officers.');
    }
});

// View all admins (Admin)
viewAdminsBtn.addEventListener('click', async () => {
    const adminsList = document.getElementById('admins-list');

    try {
        const admins = await databases.listDocuments(DATABASE_ID, 'admins');

        adminsList.innerHTML = '<h4>All Admins:</h4>';
        admins.documents.forEach(admin => {
            adminsList.innerHTML += `
                <div class="admin-item">
                    <p><strong>${admin.name}</strong></p>
                    <p>Email: ${admin.email}</p>
                </div>
            `;
        });

        adminsList.style.display = adminsList.style.display === 'none' ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading admins:', error);
        alert('Failed to load admins.');
    }
});

// Show uploaded files in UI
function showUploadedFiles(uploadResults, fileNames) {
    const uploadedFilesDiv = document.getElementById('uploaded-files');
    if (!uploadedFilesDiv) return;

    uploadedFilesDiv.innerHTML = '<h4>Recently Uploaded Files:</h4>';

    const documentTypes = {
        library: 'Library Clearance',
        departmental: 'Departmental Clearance',
        faculty: 'Faculty Clearance',
        alumni: 'Alumni Office Clearance',
        bursary: 'Bursary Clearance',
        hostel: 'Hostel Clearance'
    };

    let hasUploadedFiles = false;
    for (const [key, fileId] of Object.entries(uploadResults)) {
        if (fileId) {
            try {
                const fileName = fileNames[key] || documentTypes[key] || key;
                uploadedFilesDiv.innerHTML += `
                    <div class="uploaded-file-item">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${fileName}</span>
                        <span class="upload-status">✓ Uploaded</span>
                    </div>
                `;
                hasUploadedFiles = true;
            } catch (error) {
                console.error(`Error displaying ${key} file:`, error);
            }
        }
    }

    if (hasUploadedFiles) {
        uploadedFilesDiv.style.display = 'block';
        // Auto-hide after 10 seconds
        setTimeout(() => {
            uploadedFilesDiv.style.display = 'none';
        }, 10000);
    }
}

// Initialize app
init();
