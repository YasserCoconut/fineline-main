<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
  
    const licensePlate = writable('');
    const driverName = writable('');
    const violationType = writable('');
    const fineAmount = writable('');
    const dateIssued = writable(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const isPaid = writable(false);
    const submitting = writable(false);
    const errorMessage = writable('');
  
    async function handleSubmit(e: SubmitEvent) {
      e.preventDefault();
      submitting.set(true);
      errorMessage.set('');
  
      const payload = {
        licensePlate: $licensePlate,
        driverName: $driverName,
        violationType: $violationType,
        fineAmount: parseFloat($fineAmount),
        dateIssued: new Date($dateIssued).toISOString(),
        isPaid: $isPaid
      };
  
      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (!res.ok) throw new Error('Failed to add ticket');
  
        goto('/'); // Or wherever the ticket list is
      } catch (err) {
        errorMessage.set('Could not create ticket. Please check the inputs and try again.');
        console.error(err);
      } finally {
        submitting.set(false);
      }
    }
  </script>
  
<!-- Wrapper for full viewport centering -->
<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
  <!-- Form Container -->
  <div class="w-full max-w-xl bg-white text-gray-800 font-sans p-6 sm:p-8 rounded-lg shadow space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-semibold">Add Ticket</h1>
      <a href="/" class="px-4 py-2 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition">Back</a>
    </div>

    {#if $errorMessage}
      <div class="text-red-600 text-sm">{$errorMessage}</div>
    {/if}

    <!-- Form -->
    <form on:submit={handleSubmit} class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- License Plate -->
        <div>
          <label for="licensePlate" class="block text-sm font-medium mb-1">License Plate</label>
          <input id="licensePlate" bind:value={$licensePlate} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" required />
        </div>

        <!-- Driver Name -->
        <div>
          <label for="driverName" class="block text-sm font-medium mb-1">Driver Name</label>
          <input id="driverName" bind:value={$driverName} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" required />
        </div>

        <!-- Violation Type -->
        <div class="sm:col-span-2">
          <label for="violationType" class="block text-sm font-medium mb-1">Violation Type</label>
          <select id="violationType" bind:value={$violationType} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" required>
            <option value="" disabled selected>Select violation type</option>
            <option value="Speeding">Speeding</option>
            <option value="Running a red light">Running a red light</option>
            <option value="Illegal parking">Illegal parking</option>
            <option value="Expired registration">Expired registration</option>
            <option value="Driving without a license">Driving without a license</option>
            <option value="Seatbelt violation">Seatbelt violation</option>
            <option value="Reckless driving">Reckless driving</option>
            <option value="Using phone while driving">Using phone while driving</option>
            <option value="Failure to yield">Failure to yield</option>
            <option value="Driving under influence">Driving under influence</option>
          </select>
        </div>

        <!-- Fine Amount -->
        <div>
          <label for="fineAmount" class="block text-sm font-medium mb-1">Fine Amount</label>
          <input id="fineAmount" type="number" step="0.01" bind:value={$fineAmount} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" required />
        </div>

        <!-- Date Issued -->
        <div>
          <label for="dateIssued" class="block text-sm font-medium mb-1">Date Issued</label>
          <input id="dateIssued" type="date" bind:value={$dateIssued} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" required />
        </div>

        <!-- Is Paid -->
        <div class="sm:col-span-2 flex items-center space-x-2">
          <input id="paid" type="checkbox" bind:checked={$isPaid} class="border-gray-300" />
          <label for="paid" class="text-sm">Mark as Paid</label>
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button type="submit" class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition disabled:opacity-50" disabled={$submitting}>
          {$submitting ? 'Submitting...' : 'Add Ticket'}
        </button>
      </div>
    </form>
  </div>
</div>
