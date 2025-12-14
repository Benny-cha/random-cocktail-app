document.addEventListener('DOMContentLoaded', function() {
  // Handle all "Add to Cart" buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', async function() {
      const drinkId = this.dataset.drinkId;
      
      // Disable button and show loading state
      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = 'Adding...';
      
      try {
        const response = await fetch('/add-to-cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ drinkId: drinkId })
        });
        
        if (response.ok) {
          // Success feedback
          this.textContent = '✓ Added!';
          this.style.backgroundColor = '#28a745';
          
          // Optional: Update cart count in nav if you have one
          // updateCartCount();
          
          // Reset button after 2 seconds
          setTimeout(() => {
            this.textContent = originalText;
            this.style.backgroundColor = '';
            this.disabled = false;
          }, 2000);
        } else {
          throw new Error('Failed to add to cart');
        }
      } catch (error) {
        console.error('Error:', error);
        this.textContent = 'Error!';
        setTimeout(() => {
          this.textContent = originalText;
          this.disabled = false;
        }, 2000);
      }
    });
  });
});