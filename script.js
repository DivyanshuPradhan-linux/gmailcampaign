// Gmail Campaign Manager - Main Application Script

// Application state
let state = {
  pendingEmails: [],
  sentEmails: [],
  campaignSubject: '',
  campaignBody: ''
};

// DOM Elements
const emailListTextarea = document.getElementById('emailList');
const subjectInput = document.getElementById('subject');
const messageBodyTextarea = document.getElementById('messageBody');
const generateBtn = document.getElementById('generateBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const resetCampaignBtn = document.getElementById('resetCampaignBtn');
const pendingList = document.getElementById('pendingList');
const sentList = document.getElementById('sentList');
const pendingCount = document.getElementById('pendingCount');
const sentCount = document.getElementById('sentCount');
const totalCount = document.getElementById('totalCount');
const pendingBadge = document.getElementById('pendingBadge');
const sentBadge = document.getElementById('sentBadge');
const emailCount = document.getElementById('emailCount');
const messageCount = document.getElementById('messageCount');
const instructionsModal = document.getElementById('instructionsModal');
const closeModalBtn = document.querySelector('.close-modal');
const startBtn = document.getElementById('startBtn');
const currentYearSpan = document.getElementById('currentYear');

// Initialize the application
function init() {
  // Set current year in footer
  currentYearSpan.textContent = new Date().getFullYear();
  
  // Load saved state from localStorage
  loadState();
  
  // Update character counts
  updateEmailCount();
  updateMessageCount();
  
  // Setup event listeners
  setupEventListeners();
  
  // Render initial UI
  renderUI();
  
  // Show instructions modal on first visit
  const firstVisit = localStorage.getItem('gmailCampaignFirstVisit');
  if (!firstVisit) {
    showModal();
    localStorage.setItem('gmailCampaignFirstVisit', 'true');
  }
}

// Load state from localStorage
function loadState() {
  const savedState = localStorage.getItem('gmailCampaignState');
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      state = {
        pendingEmails: parsedState.pendingEmails || [],
        sentEmails: parsedState.sentEmails || [],
        campaignSubject: parsedState.campaignSubject || '',
        campaignBody: parsedState.campaignBody || ''
      };
      
      // Update form fields from saved state
      if (state.campaignSubject) subjectInput.value = state.campaignSubject;
      if (state.campaignBody) messageBodyTextarea.value = state.campaignBody;
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem('gmailCampaignState', JSON.stringify(state));
}

// Setup event listeners
function setupEventListeners() {
  // Generate campaign button
  generateBtn.addEventListener('click', generateCampaign);
  
  // Clear all button
  clearAllBtn.addEventListener('click', clearAll);
  
  // Reset campaign button
  resetCampaignBtn.addEventListener('click', resetCampaign);
  
  // Email list textarea input
  emailListTextarea.addEventListener('input', updateEmailCount);
  
  // Message body textarea input
  messageBodyTextarea.addEventListener('input', updateMessageCount);
  
  // Modal controls
  closeModalBtn.addEventListener('click', hideModal);
  startBtn.addEventListener('click', hideModal);
  
  // Click outside modal to close
  instructionsModal.addEventListener('click', function(e) {
    if (e.target === instructionsModal) {
      hideModal();
    }
  });
  
  // Escape key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hideModal();
    }
  });
}

// Update email count display
function updateEmailCount() {
  const emails = emailListTextarea.value.trim();
  const emailArray = emails ? emails.split('\n').filter(email => email.trim() !== '') : [];
  emailCount.textContent = emailArray.length;
}

// Update message character count
function updateMessageCount() {
  const message = messageBodyTextarea.value;
  messageCount.textContent = message.length;
}

// Generate campaign from input data
function generateCampaign() {
  const emails = emailListTextarea.value.trim();
  const subject = subjectInput.value.trim();
  const body = messageBodyTextarea.value.trim();
  
  // Validate inputs
  if (!emails) {
    alert('Please enter at least one email address.');
    emailListTextarea.focus();
    return;
  }
  
  if (!subject) {
    alert('Please enter a subject for your email campaign.');
    subjectInput.focus();
    return;
  }
  
  if (!body) {
    alert('Please enter a message body for your email campaign.');
    messageBodyTextarea.focus();
    return;
  }
  
  // Parse email list (one per line)
  const emailArray = emails.split('\n')
    .map(email => email.trim())
    .filter(email => email !== '');
  
  // Create email objects
  const newPendingEmails = emailArray.map(email => {
    return {
      email: email,
      subject: subject,
      body: body,
      id: generateId()
    };
  });
  
  // Update state
  state.pendingEmails = newPendingEmails;
  state.sentEmails = []; // Reset sent emails when generating new campaign
  state.campaignSubject = subject;
  state.campaignBody = body;
  
  // Save state and render UI
  saveState();
  renderUI();
  
  // Show success message
  showNotification(`Campaign generated with ${newPendingEmails.length} emails.`);
}

// Clear all data
function clearAll() {
  if (confirm('Are you sure you want to clear all data? This will remove all emails and reset the form.')) {
    // Clear form fields
    emailListTextarea.value = '';
    subjectInput.value = '';
    messageBodyTextarea.value = '';
    
    // Clear state
    state.pendingEmails = [];
    state.sentEmails = [];
    state.campaignSubject = '';
    state.campaignBody = '';
    
    // Save and render
    saveState();
    renderUI();
    updateEmailCount();
    updateMessageCount();
    
    // Show notification
    showNotification('All data cleared successfully.');
  }
}

// Reset campaign (keep form data, clear email lists)
function resetCampaign() {
  if (confirm('Reset the campaign? This will clear all pending and sent emails but keep your form data.')) {
    // Clear email lists in state
    state.pendingEmails = [];
    state.sentEmails = [];
    
    // Save and render
    saveState();
    renderUI();
    
    // Show notification
    showNotification('Campaign reset successfully.');
  }
}

// Generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Render the UI based on current state
function renderUI() {
  // Update counters
  const pendingTotal = state.pendingEmails.length;
  const sentTotal = state.sentEmails.length;
  const total = pendingTotal + sentTotal;
  
  pendingCount.textContent = pendingTotal;
  sentCount.textContent = sentTotal;
  totalCount.textContent = total;
  pendingBadge.textContent = pendingTotal;
  sentBadge.textContent = sentTotal;
  
  // Render pending emails list
  renderEmailList(pendingList, state.pendingEmails, 'pending');
  
  // Render sent emails list
  renderEmailList(sentList, state.sentEmails, 'sent');
}

// Render an email list (pending or sent)
function renderEmailList(container, emails, type) {
  // Clear container
  container.innerHTML = '';
  
  // If no emails, show empty state
  if (emails.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    if (type === 'pending') {
      emptyState.innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>No pending emails. Generate a campaign to get started.</p>
            `;
    } else {
      emptyState.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <p>No sent emails yet. Click on pending emails to send them.</p>
            `;
    }
    
    container.appendChild(emptyState);
    return;
  }
  
  // Create email items
  emails.forEach(email => {
    const emailItem = createEmailElement(email, type);
    container.appendChild(emailItem);
  });
}

// Create an email element
function createEmailElement(emailData, type) {
  const emailItem = document.createElement('div');
  emailItem.className = `email-item ${type}`;
  emailItem.dataset.id = emailData.id;
  
  const emailContent = document.createElement('div');
  emailContent.className = 'email-content';
  
  const emailAddress = document.createElement('div');
  emailAddress.className = 'email-address';
  emailAddress.textContent = emailData.email;
  
  const emailSubject = document.createElement('div');
  emailSubject.className = 'email-subject';
  emailSubject.textContent = `Subject: ${emailData.subject}`;
  
  emailContent.appendChild(emailAddress);
  emailContent.appendChild(emailSubject);
  
  const emailActions = document.createElement('div');
  emailActions.className = 'email-actions';
  
  const emailStatus = document.createElement('div');
  emailStatus.className = `email-status status-${type}`;
  emailStatus.textContent = type === 'pending' ? 'Pending' : 'Sent';
  
  emailActions.appendChild(emailStatus);
  
  if (type === 'pending') {
    const sendIcon = document.createElement('i');
    sendIcon.className = 'fas fa-paper-plane send-icon';
    sendIcon.title = 'Click to send this email';
    emailActions.appendChild(sendIcon);
    
    // Add click event to send email
    emailItem.addEventListener('click', function(e) {
      if (!e.target.classList.contains('send-icon')) {
        sendEmail(emailData);
      }
    });
    
    // Also allow clicking on the icon
    sendIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      sendEmail(emailData);
    });
  } else {
    // For sent emails, add a checkmark
    const checkIcon = document.createElement('i');
    checkIcon.className = 'fas fa-check-circle';
    checkIcon.style.color = '#10b981';
    emailActions.appendChild(checkIcon);
  }
  
  emailItem.appendChild(emailContent);
  emailItem.appendChild(emailActions);
  
  return emailItem;
}

// Send an email (opens Gmail with mailto:)
function sendEmail(emailData) {
  // Encode subject and body for URL
  const encodedSubject = encodeURIComponent(emailData.subject);
  const encodedBody = encodeURIComponent(emailData.body);
  
  // Create mailto link
  const mailtoLink = `mailto:${emailData.email}?subject=${encodedSubject}&body=${encodedBody}`;
  
  // Open Gmail
  window.open(mailtoLink, '_blank');
  
  // Move email from pending to sent
  moveEmailToSent(emailData.id);
}

// Move an email from pending to sent
function moveEmailToSent(emailId) {
  // Find email in pending list
  const emailIndex = state.pendingEmails.findIndex(email => email.id === emailId);
  
  if (emailIndex !== -1) {
    // Remove from pending and add to sent
    const [emailToMove] = state.pendingEmails.splice(emailIndex, 1);
    state.sentEmails.push(emailToMove);
    
    // Save state and update UI
    saveState();
    renderUI();
    
    // Show notification
    showNotification(`Email to ${emailToMove.email} marked as sent.`);
  }
}

// Show notification
function showNotification(message) {
  // Remove existing notification if any
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1a73e8 0%, #5e35b1 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-weight: 500;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Show modal
function showModal() {
  instructionsModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal() {
  instructionsModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);