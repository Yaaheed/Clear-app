// Initialize Appwrite SDK
import { Client, Account, Databases, Storage, Functions, Query } from 'https://esm.sh/appwrite@11.0.0';

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
        navigator.serviceWorker.register('/sw.js')
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
    const installSection = document.getElementById('install-section');
    const authSection = document.getElementById('auth-section');
    installSection.style.display = 'block';
    authSection.style.display = 'none';

    const installBtn = document.getElementById('install-btn');
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
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
        await account.createEmailPasswordSession(email, password);
        const user = await account.get();

        // Handle remember me (store email in localStorage)
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        showDashboard(user);
    } catch (error) {
        let errorMessage = 'Login failed. Please try again.';

        if (error.message.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('User not found')) {
            errorMessage = 'Account not found. Please check your email or register first.';
        } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
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
});

registerBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    setLoading(registerBtn, true);
    registerBtn.dataset.originalText = 'Register as Student';

    try {
        await account.create('unique()', email, password);
        alert('Registration successful! Please login.');
    } catch (error) {
        alert('Registration failed: ' + error.message);
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

        // Check if user is admin in admins collection
        const adminCheck = await databases.listDocuments(DATABASE_ID, 'admins', [
            Query.equal('adminId', user.$id)
        ]);
        if (adminCheck.documents.length > 0) {
            showAdminDashboard();
            return;
        }

        // Check if user is officer
        const officer = await databases.listDocuments(DATABASE_ID, 'officers', [
            Query.equal('officerId', user.$id)
        ]);

        if (officer.documents.length > 0) {
            showOfficerDashboard();
        } else {
            showStudentDashboard(user);
        }
    } catch (error) {
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
            // Create student record
            const name = prompt('Enter your full name:');
            const matric = prompt('Enter your matriculation number:');
            const department = prompt('Enter your department:');

            await databases.createDocument(DATABASE_ID, 'students', 'unique()', {
                userId: user.$id,
                name,
                matric,
                email: user.email,
                department,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            document.getElementById('student-info').innerHTML = `
                <p>Name: ${name}</p>
                <p>Matric: ${matric}</p>
                <p>Department: ${department}</p>
                <p>Status: <span class="status-pending">pending</span></p>
            `;
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

// Upload documents
uploadBtn.addEventListener('click', async () => {
    const passportFile = document.getElementById('passport-upload').files[0];
    const docFiles = document.getElementById('docs-upload').files;

    if (!passportFile) {
        alert('Please upload passport photo');
        return;
    }

    try {
        // Upload passport
        const passportUpload = await storage.createFile('student_passports', 'unique()', passportFile);
        const passportId = passportUpload.$id;

        // Upload documents
        const docIds = [];
        for (let file of docFiles) {
            const upload = await storage.createFile('clearance_docs', 'unique()', file);
            docIds.push(upload.$id);
        }

        // Update student record
        const user = await account.get();
        await databases.updateDocument(DATABASE_ID, 'students', user.$id, {
            passportFileId: passportId
        });

        // Get student data
        const student = await databases.listDocuments(DATABASE_ID, 'students', [
            Query.equal('userId', user.$id)
        ]);
        const studentData = student.documents[0];

        // Create clearance record
        await databases.createDocument(DATABASE_ID, 'clearances', 'unique()', {
            studentId: user.$id,
            studentName: studentData.name,
            department: studentData.department,
            passportFileId: passportId,
            docs: JSON.stringify(docIds),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        alert('Documents uploaded successfully!');
    } catch (error) {
        alert('Upload failed: ' + error.message);
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
            const docIds = JSON.parse(clearance.docs || '[]');

            documentsList.innerHTML = '<h4>Uploaded Documents:</h4>';
            if (docIds.length > 0) {
                for (let docId of docIds) {
                    try {
                        const file = await storage.getFile('clearance_docs', docId);
                        documentsList.innerHTML += `<p><a href="${storage.getFileView('clearance_docs', docId)}" target="_blank">${file.name}</a></p>`;
                    } catch (error) {
                        console.error('Error loading document:', error);
                    }
                }
            } else {
                documentsList.innerHTML += '<p>No documents uploaded yet.</p>';
            }

            if (clearance.passportFileId) {
                try {
                    const passportFile = await storage.getFile('student_passports', clearance.passportFileId);
                    documentsList.innerHTML += `<p><strong>Passport Photo:</strong> <a href="${storage.getFileView('student_passports', clearance.passportFileId)}" target="_blank">${passportFile.name}</a></p>`;
                } catch (error) {
                    console.error('Error loading passport:', error);
                }
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

// Initialize app
init();
