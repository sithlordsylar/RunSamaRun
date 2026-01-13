// src/modal.js

function createModal(content, onConfirm) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'overlay menu';
  modalOverlay.innerHTML = `
    <div class="panel">
      ${content}
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const confirmButton = modalOverlay.querySelector('.confirm-button');
  if (confirmButton) {
    confirmButton.onclick = () => {
      document.body.removeChild(modalOverlay);
      if (onConfirm) {
        onConfirm();
      }
    };
  }

  return modalOverlay;
}

export function showGameOverModal(score, onConfirm) {
  const content = `
    <h2>Game Over</h2>
    <p>Your score: ${score}</p>
    <input type="text" id="name-input" placeholder="Enter your name" maxlength="32">
    <input type="text" id="message-input" placeholder="Leave a message" maxlength="140">
    <button class="confirm-button btn">Submit</button>
  `;
  createModal(content, () => {
    const name = document.getElementById('name-input').value;
    const message = document.getElementById('message-input').value;
    onConfirm({ name, message });
  });
}
