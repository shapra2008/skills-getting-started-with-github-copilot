document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear dropdown to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with delete buttons
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="activity-card-participants">
              <div class="activity-card-participants-title">Participants</div>
              <ul class="activity-card-participants-list no-bullets">
                ${details.participants.map(email => `
                  <li style="display:flex;align-items:center;gap:8px;">
                    <span>${email}</span>
                    <button class="delete-participant-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" title="Unregister">✖</button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="activity-card-participants">
              <div class="activity-card-participants-title">Participants</div>
              <div class="activity-card-participants-list" style="color:#888;font-style:italic;">No participants yet</div>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;


        activitiesList.appendChild(activityCard);

        // Add event listeners for delete buttons after rendering
        setTimeout(() => {
          const deleteBtns = activityCard.querySelectorAll('.delete-participant-btn');
          deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const activity = decodeURIComponent(btn.getAttribute('data-activity'));
              const email = decodeURIComponent(btn.getAttribute('data-email'));
              if (confirm(`Unregister ${email} from ${activity}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
                  const result = await response.json();
                  if (response.ok) {
                    fetchActivities();
                  } else {
                    alert(result.detail || 'Failed to unregister.');
                  }
                } catch (err) {
                  alert('Error unregistering participant.');
                }
              }
            });
          });
        }, 0);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities to reflect new participant
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
