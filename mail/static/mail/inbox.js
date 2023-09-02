document.addEventListener('DOMContentLoaded', function() {
  
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_message);
  // By default, load the inbox
  load_mailbox('inbox');  
});

function send_message(event) {
  // Removes message-detail from the view while sending message is open 
  document.querySelector('#message').style.display = 'none';

  event.preventDefault();
  // Selecting values from the form
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  // Alerting about the result/error of the sent message
  .then(response => response.json())
  .then(result => {
    if (result.message) {
      // Email sent successfully
      alert(result.message);
      load_mailbox('sent');
    } else if (result.error) {
      // Error in sending email
      alert(result.error);
    }
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#message').className = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// Once the message was clicked it renders this function 
function load_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
     // Removes other sections from the view while message's details is open 
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    // Assigning message's class from bootstrap so that it is flexible
    document.querySelector('#message').className = 'd-flex flex-wrap';

    // Filling in the data from the message 
    document.querySelector('#message-from').innerHTML = email.sender;
    document.querySelector('#message-to').innerHTML = email.recipients;
    document.querySelector('#message-subject').innerHTML = email.subject;
    document.querySelector('#message-timestamp').innerHTML = email.timestamp;
    document.querySelector('#message-body').innerHTML = email.body;

    // ... do something else with email ...
    if (!email.read) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
    // Checks if the message is archive/unarchive 
    const button = document.querySelector('#archive-unarchive');
    button.className = 'btn btn-sm btn-outline-primary';
    button.innerHTML = email.archived ? "Unarchive" : "Archive";

    // If the button is clicked ->
    button.addEventListener('click', function() {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      .then(() => window.location.href = '');
    });
    document.querySelector('#message').append(button);


    // Replying to the message
    const reply = document.querySelector('#reply');

    // If the button is clicked ->
    reply.addEventListener('click', function() {
      // Renders the compose_email form filled in with the previous message data
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject;
      if (subject.split(' ', 1)[0] != "Re:") {
        subject = "Re: " + email.subject;
      };
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `\n>> On ${email.timestamp} ${email.sender} wrote: \n"${email.body}"`;
    });
  });
}

// Loads all messages from the user's mailbox
function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#message').className = 'none';
  document.querySelector('#message').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Disabling the archive/unarchive function for the sent messages
  if (mailbox === 'sent') {
    document.querySelector('#archive-unarchive').style.display = 'none';
  } else {
    document.querySelector('#archive-unarchive').style.display = 'block';
  }
 
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><hr>`;

  // Applying read/unread background only for incoming messages. Creating divs for messages.
  if (mailbox == "inbox"){
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(email => {
        // Using for loop for each messages which will be displayed in its own container
        email.forEach(message => {
          const element = document.createElement('div');
          element.className = 'list-group-item';
          element.style.cursor = 'pointer';
          
          // Checks if the message is read or not
          if (message.read) {
            const color = '#f3f2f2'
            element.style.backgroundColor = color;
          } else if (mailbox == 'sent') {
            const color = '#ffffff'
            element.style.backgroundColor = color;
          }
          // Assigning values from the message to the container
          element.innerHTML = `
          <h6>${message.subject}</h6>
          <h7><span class="list-items">From: </span>${message.sender}</h7>
          <p class="time">${message.timestamp}</p>
          `;
          // Once the message was clicked it renders the 'load_email' function which shows message's details
          element.addEventListener('click', function() {
            load_email(message.id);
          });
          document.querySelector('#emails-view').append(element);
        })
    }); 
  // The same thing here except the fact that other sections do not show read/unread feature
  } else {
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(email => {
        email.forEach(message => {
          const element = document.createElement('div');
          element.className = 'list-group-item';
          element.style.cursor = 'pointer';
          element.innerHTML = `
          <h6>${message.subject}</h6>
          <h7><span class="list-items">From: </span>${message.sender}</h7>
          <p class="time">${message.timestamp}</p>
          `;
          element.addEventListener('click', function() {
            load_email(message.id);
          });
          document.querySelector('#emails-view').append(element);
        })
    }); 
  };
}