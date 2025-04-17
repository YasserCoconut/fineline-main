<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { writable, derived } from 'svelte/store';
  import type { Ticket } from '$lib/types';
  import jsPDF from 'jspdf';

  const tickets = writable<Ticket[]>([]);
  const searchQuery = writable('');
  const paymentFilter = writable<'all' | 'paid' | 'unpaid'>('all');
  const sortKey = writable<'fineAmount' | 'dateIssued' | null>(null);
  const sortDirection = writable<'asc' | 'desc'>('asc');

  onMount(async () => {
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) throw new Error('Failed to load tickets');
      const data: Ticket[] = await res.json();
      tickets.set(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  });

  const filteredTickets = derived(
    [tickets, searchQuery, paymentFilter, sortKey, sortDirection],
    ([$tickets, $searchQuery, $paymentFilter, $sortKey, $sortDirection]) => {
      const query = $searchQuery.toLowerCase();

      let result = $tickets.filter((ticket) => {
        const matchesSearch =
          ticket.driverName.toLowerCase().includes(query) ||
          ticket.licensePlate.toLowerCase().includes(query);

        const matchesPayment =
          $paymentFilter === 'all' ||
          ($paymentFilter === 'paid' && ticket.isPaid) ||
          ($paymentFilter === 'unpaid' && !ticket.isPaid);

        return matchesSearch && matchesPayment;
      });

      if ($sortKey) {
        result = result.slice().sort((a, b) => {
          const aVal = $sortKey === 'fineAmount'
            ? parseFloat(a.fineAmount)
            : new Date(a.dateIssued ?? 0).getTime();
          const bVal = $sortKey === 'fineAmount'
            ? parseFloat(b.fineAmount)
            : new Date(b.dateIssued ?? 0).getTime();
          return $sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

      return result;
    }
  );

  function toggleSort(key: 'fineAmount' | 'dateIssued') {
    sortKey.update(currentKey => {
      if (currentKey === key) {
        sortDirection.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
        return key;
      } else {
        sortDirection.set('asc');
        return key;
      }
    });
  }

  function getSortIndicator(key: 'fineAmount' | 'dateIssued') {
    return $sortKey === key ? ($sortDirection === 'asc' ? '↑' : '↓') : '';
  }

  function handleRowClick(id: number) {
    goto(`/tickets/${id}`);
  }

  function handlePrint(ticket: Ticket) {
  const doc = new jsPDF();
  const left = 20;
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FineLine Violation Ticket', left, y);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text('Violation Receipt & Payment Record', left, y);

  // Divider
  y += 8;
  doc.setDrawColor(150);
  doc.line(left, y, 190, y);

  // Ticket Info Block
  y += 10;
  const infoPairs = [
    ['Ticket ID', ticket.id.toString()],
    ['License Plate', ticket.licensePlate],
    ['Driver Name', ticket.driverName],
    ['Violation Type', ticket.violationType],
    ['Fine Amount', `$${parseFloat(ticket.fineAmount).toFixed(2)}`],
    ['Date Issued', ticket.dateIssued ? new Date(ticket.dateIssued).toLocaleDateString() : 'N/A'],
    ['Status', ticket.isPaid ? 'Paid' : 'Unpaid']
  ];

  doc.setFontSize(11);
  for (const [label, value] of infoPairs) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${value}`, left + 50, y);
    y += 8;
  }

  // Divider
  y += 2;
  doc.setDrawColor(200);
  doc.line(left, y, 190, y);

  // Footer Notes
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Please keep this ticket as your official record. If unpaid, payment must be made within 15 days.',
    left,
    y
  );
  y += 6;
  doc.text('For inquiries, contact violations@fineline.gov or call +971-555-555-555.', left, y);

  // Save
  doc.save(`ticket-${ticket.id}.pdf`);
}

function handleEmail(ticket: Ticket) {
  // Generate PDF
  const doc = new jsPDF();
  const fileName = `ticket-${ticket.id}.pdf`;
  const pdfBlob = doc.output('blob');

  // Fill in PDF content (same as handlePrint)
  const left = 20;
  let y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FineLine Violation Ticket', left, y);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text('Violation Receipt & Payment Record', left, y);
  y += 8;
  doc.line(left, y, 190, y);
  y += 10;

  const infoPairs = [
    ['Ticket ID', ticket.id.toString()],
    ['License Plate', ticket.licensePlate],
    ['Driver Name', ticket.driverName],
    ['Violation Type', ticket.violationType],
    ['Fine Amount', `$${parseFloat(ticket.fineAmount).toFixed(2)}`],
    ['Date Issued', ticket.dateIssued ? new Date(ticket.dateIssued).toLocaleDateString() : 'N/A'],
    ['Status', ticket.isPaid ? 'Paid' : 'Unpaid']
  ];

  doc.setFontSize(11);
  for (const [label, value] of infoPairs) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${value}`, left + 50, y);
    y += 8;
  }

  y += 2;
  doc.line(left, y, 190, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Please keep this ticket as your official record.',
    left,
    y
  );

  // Trigger download
  doc.save(fileName);

  // Open email client with pre-filled message
  const subject = encodeURIComponent(`Violation Ticket - #${ticket.id}`);
  const body = encodeURIComponent(`Dear recipient,

Please find attached the violation ticket for:
- License Plate: ${ticket.licensePlate}
- Violation Type: ${ticket.violationType}
- Fine Amount: $${parseFloat(ticket.fineAmount).toFixed(2)}
- Status: ${ticket.isPaid ? 'Paid' : 'Unpaid'}

The ticket has been downloaded to your computer. Please attach the PDF named "${fileName}" when sending this email.

Regards,
FineLine System`);

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}


</script>

<div class="space-y-6 p-4 sm:p-6 bg-white text-gray-800 font-sans">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
    <h1 class="text-xl font-bold">FineLine</h1>
    <a href="/tickets/add" class="w-full sm:w-auto text-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
      Add Ticket
    </a>
  </div>

  <!-- Filters -->
  <div class="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
    <input
      type="text"
      placeholder="Search by driver or plate"
      class="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      on:input={(e) => searchQuery.set((e.target as HTMLInputElement).value)}
    />

    <select
      class="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      on:change={(e) => paymentFilter.set((e.target as HTMLSelectElement).value as 'all' | 'paid' | 'unpaid')}
    >
      <option value="all">All</option>
      <option value="paid">Paid</option>
      <option value="unpaid">Unpaid</option>
    </select>
  </div>

  <!-- Table -->
  <div class="overflow-x-auto rounded-xl border border-gray-200">
    <table class="min-w-full table-auto text-sm">
      <thead class="bg-gray-100">
        <tr class="text-gray-600 whitespace-nowrap">
          <th class="px-4 py-3 text-left">License Plate</th>
          <th class="px-4 py-3 text-left">Driver Name</th>
          <th class="px-4 py-3 text-left">Violation</th>
          <th class="px-4 py-3 text-left cursor-pointer select-none" on:click={() => toggleSort('fineAmount')}>
            Fine {getSortIndicator('fineAmount')}
          </th>
          <th class="px-4 py-3 text-left cursor-pointer select-none" on:click={() => toggleSort('dateIssued')}>
            Date Issued {getSortIndicator('dateIssued')}
          </th>
          <th class="px-4 py-3 text-left">Status</th>
          <th class="px-4 py-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $filteredTickets as ticket}
          <tr
            class="border-t border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
            on:click={() => handleRowClick(ticket.id)}
          >
            <td class="px-4 py-3 whitespace-nowrap">{ticket.licensePlate}</td>
            <td class="px-4 py-3 whitespace-nowrap">{ticket.driverName}</td>
            <td class="px-4 py-3">{ticket.violationType}</td>
            <td class="px-4 py-3 whitespace-nowrap">${parseFloat(ticket.fineAmount).toFixed(2)}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              {ticket.dateIssued
                ? new Date(ticket.dateIssued).toLocaleDateString()
                : 'N/A'}
            </td>
            <td class="px-4 py-3">
              <span class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                ticket.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {ticket.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </td>
            <td class="px-4 py-3">
              <button
                class="text-blue-600 mr-4 hover:underline text-sm"
                on:click|stopPropagation={() => handlePrint(ticket)}
              >
                Print
              </button>
              <button
  class="text-indigo-600 hover:underline text-sm"
  on:click|stopPropagation={() => handleEmail(ticket)}
>
  Email
</button>
            </td>
          </tr>
        {:else}
          <tr>
            <td class="px-4 py-6 text-center text-gray-400" colspan="7">No tickets found.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
