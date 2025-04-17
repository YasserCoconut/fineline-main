<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { writable, get } from 'svelte/store';
    import type { Ticket } from '$lib/types';
  
    const licensePlate = writable('');
    const driverName = writable('');
    const violationType = writable('');
    const fineAmount = writable('');
    const dateIssued = writable('');
    const isPaid = writable(false);
    const loading = writable(true);
    const submitting = writable(false);
    const errorMessage = writable('');
  
    const violationOptions = [
      'Speeding',
      'Running a red light',
      'Illegal parking',
      'Expired registration',
      'Driving without a license',
      'Seatbelt violation',
      'Reckless driving',
      'Using phone while driving',
      'Failure to yield',
      'Driving under influence'
    ];
  
    let ticketId: number;
  
    onMount(async () => {
      ticketId = Number(get(page).params.id);
  
      try {
        const res = await fetch(`/api/tickets/${ticketId}`);
        if (!res.ok) throw new Error('Ticket not found');
  
        const data: Ticket = await res.json();
        licensePlate.set(data.licensePlate);
        driverName.set(data.driverName);
        violationType.set(data.violationType);
        fineAmount.set(data.fineAmount.toString());
        dateIssued.set(
  data.dateIssued
    ? new Date(data.dateIssued).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)
);
        isPaid.set(data.isPaid);
      } catch (err) {
        console.error(err);
        errorMessage.set('Ticket not found or failed to load.');
      } finally {
        loading.set(false);
      }
    });
  
    async function handleUpdate(e: SubmitEvent) {
      e.preventDefault();
      submitting.set(true);
      errorMessage.set('');
  
      try {
        const res = await fetch(`/api/tickets/${ticketId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licensePlate: $licensePlate,
            driverName: $driverName,
            violationType: $violationType,
            fineAmount: parseFloat($fineAmount),
            dateIssued: new Date($dateIssued).toISOString(),
            isPaid: $isPaid
          })
        });
  
        if (!res.ok) throw new Error('Failed to update ticket');
        goto('/');
      } catch (err) {
        console.error(err);
        errorMessage.set('Update failed. Please try again.');
      } finally {
        submitting.set(false);
      }
    }
  
    async function handleDelete() {
      if (!confirm('Are you sure you want to delete this ticket?')) return;
  
      try {
        const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        goto('/');
      } catch (err) {
        console.error(err);
        errorMessage.set('Could not delete ticket.');
      }
    }
  </script>
  
<!-- Fullscreen wrapper to center form -->
<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <!-- Form container -->
    <div class="w-full max-w-xl bg-white text-gray-800 font-sans p-6 sm:p-8 rounded-lg shadow space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Edit Ticket</h1>
        <a href="/" class="px-4 py-2 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition">Back</a>
      </div>
  
      {#if $errorMessage}
        <div class="text-red-600 text-sm">{$errorMessage}</div>
      {/if}
  
      {#if !$loading}
        <form on:submit={handleUpdate} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="licensePlate" class="block text-sm font-medium mb-1">License Plate</label>
              <input id="licensePlate" bind:value={$licensePlate} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
  
            <div>
              <label for="driverName" class="block text-sm font-medium mb-1">Driver Name</label>
              <input id="driverName" bind:value={$driverName} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
  
            <div class="sm:col-span-2">
              <label for="violationType" class="block text-sm font-medium mb-1">Violation Type</label>
              <select id="violationType" bind:value={$violationType} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Select violation</option>
                {#each violationOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </div>
  
            <div>
              <label for="fineAmount" class="block text-sm font-medium mb-1">Fine Amount</label>
              <input id="fineAmount" type="number" step="0.01" bind:value={$fineAmount} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
  
            <div>
              <label for="dateIssued" class="block text-sm font-medium mb-1">Date Issued</label>
              <input id="dateIssued" type="date" bind:value={$dateIssued} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
  
            <div class="sm:col-span-2 flex items-center space-x-2">
              <input id="paid" type="checkbox" bind:checked={$isPaid} class="border-gray-300" />
              <label for="paid" class="text-sm">Mark as Paid</label>
            </div>
          </div>
  
          <div class="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4">
            <button type="submit" class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition disabled:opacity-50" disabled={$submitting}>
              {$submitting ? 'Updating...' : 'Update Ticket'}
            </button>
  
            <button type="button" on:click={handleDelete} class="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition">
              Delete
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
  