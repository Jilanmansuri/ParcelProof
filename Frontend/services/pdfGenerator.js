import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export function formatReportDateTime(dateInput) {
  if (!dateInput) return 'N/A';

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, '0') : '12';

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

export async function exportProofAsPdf(proof) {
  if (!proof) {
    throw new Error('No proof data provided for PDF generation');
  }

  const photos = proof.photos?.length
    ? proof.photos
    : proof.photo
      ? [proof.photo]
      : [];

  const photoCount = photos.length;
  const formattedDate = formatReportDateTime(proof.createdAt || new Date());

  const statusColorMap = {
    Submitted: { bg: '#e8f4fd', text: '#1976d2', border: '#90caf9' },
    'In Progress': { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
    Resolved: { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' },
    Closed: { bg: '#eceff1', text: '#546e7a', border: '#b0bec5' },
  };

  const statusStyle = statusColorMap[proof.status] || {
    bg: '#f5f5f5',
    text: '#333333',
    border: '#cccccc',
  };

  const conditionColorMap = {
    Good: { bg: '#e8f5e9', text: '#2e7d32' },
    Damaged: { bg: '#ffebee', text: '#c62828' },
    'Wrong Product': { bg: '#fff8e1', text: '#f57f17' },
    'Missing Item': { bg: '#f3e5f5', text: '#6a1b9a' },
    Tampered: { bg: '#fbe9e7', text: '#d84315' },
  };

  const conditionStyle = conditionColorMap[proof.condition] || {
    bg: '#f5f5f5',
    text: '#424242',
  };

  const hasGps = Boolean(
    proof.latitude &&
    proof.longitude &&
    String(proof.latitude).trim() !== '' &&
    String(proof.latitude).trim() !== 'N/A' &&
    String(proof.longitude).trim() !== '' &&
    String(proof.longitude).trim() !== 'N/A'
  );

  const rawAddress = (proof.address || '').trim();
  const isAddressMissing =
    !rawAddress ||
    rawAddress.toLowerCase() === 'address not found' ||
    rawAddress.toLowerCase() === 'unknown address' ||
    rawAddress.toLowerCase() === 'fetching address...' ||
    rawAddress.toLowerCase() === 'not provided';

  let displayAddress = '';
  if (!isAddressMissing) {
    displayAddress = rawAddress;
  } else if (hasGps) {
    displayAddress = 'Address unavailable — GPS coordinates captured';
  } else {
    displayAddress = 'Address unavailable';
  }

  let cardWidth = 'calc(50% - 6px)';
  let frameHeight = '180px';

  if (photoCount === 1) {
    cardWidth = '100%';
    frameHeight = '230px';
  } else if (photoCount === 2) {
    cardWidth = 'calc(50% - 6px)';
    frameHeight = '180px';
  } else if (photoCount === 3) {
    cardWidth = 'calc(50% - 6px)';
    frameHeight = '145px';
  } else if (photoCount === 4) {
    cardWidth = 'calc(50% - 6px)';
    frameHeight = '125px';
  } else if (photoCount >= 5) {
    cardWidth = 'calc(33.333% - 6px)';
    frameHeight = '110px';
  }

  const photoHtml = photoCount > 0
    ? `
      <div class="photos-grid">
        ${photos.map((url, i) => `
          <div class="photo-card" style="flex: 0 0 ${cardWidth};">
            <div class="photo-card-header">
              <span class="photo-badge">Photo #${i + 1}</span>
              <span class="photo-type">${i === 0 ? 'Primary Evidence' : 'Supporting View'}</span>
            </div>
            <div class="photo-frame" style="height: ${frameHeight};">
              <img src="${url}" class="evidence-img" alt="Evidence #${i + 1}" />
            </div>
            <div class="photo-footer">
              <span>Order: ${proof.orderId || proof.reportId}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `
    : `<div class="no-photo-box">No photographic evidence was recorded for this report.</div>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>ParcelProof - ${proof.reportId}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 14mm 8mm 14mm;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          background: #ffffff;
          padding: 0;
          line-height: 1.42;
          font-size: 11.5px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #2563eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .brand-title {
          font-size: 24px;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: -0.5px;
          line-height: 1.15;
        }

        .brand-title span {
          color: #0f172a;
        }

        .brand-tagline {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.8px;
          margin-top: 2px;
        }

        .doc-meta {
          text-align: right;
        }

        .report-id-label {
          font-size: 9.5px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .report-id-val {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          font-family: monospace;
          word-break: break-all;
        }

        .generated-date {
          font-size: 10.5px;
          color: #64748b;
          margin-top: 3px;
        }

        .summary-banner {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3.5px solid #2563eb;
          padding: 8px 14px;
          border-radius: 5px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .banner-text {
          font-size: 11.5px;
          color: #334155;
        }

        .banner-text strong {
          color: #0f172a;
        }

        .status-badge {
          display: inline-block;
          background: ${statusStyle.bg};
          color: ${statusStyle.text};
          border: 1px solid ${statusStyle.border};
          padding: 3px 12px;
          border-radius: 14px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section {
          margin-bottom: 12px;
          page-break-inside: avoid;
        }

        .section-header {
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #2563eb;
          margin-bottom: 6px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          overflow: hidden;
        }

        .data-table tr {
          border-bottom: 1px solid #f1f5f9;
        }

        .data-table tr:last-child {
          border-bottom: none;
        }

        .data-table td {
          padding: 7px 10px;
          font-size: 11.5px;
          vertical-align: top;
        }

        .cell-label {
          width: 20%;
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 9.5px;
          letter-spacing: 0.4px;
        }

        .cell-val {
          width: 30%;
          color: #0f172a;
          font-weight: 500;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .cell-val.bold {
          font-weight: 700;
        }

        .condition-pill {
          display: inline-block;
          background: ${conditionStyle.bg};
          color: ${conditionStyle.text};
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 10.5px;
        }

        .desc-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 7px 10px;
          font-size: 11px;
          color: #334155;
          line-height: 1.4;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          margin-top: 3px;
        }

        .gps-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 700;
          margin-left: 8px;
        }

        .gps-verified {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .gps-missing {
          background: #f1f5f9;
          color: #64748b;
        }

        .gps-unavailable-text {
          color: #64748b;
          font-style: italic;
        }

        .photos-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 5px;
        }

        .photo-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          overflow: hidden;
          page-break-inside: avoid;
          box-sizing: border-box;
        }

        .photo-card-header {
          padding: 4px 8px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .photo-badge {
          font-size: 9.5px;
          font-weight: 700;
          color: #2563eb;
        }

        .photo-type {
          font-size: 8.5px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
        }

        .photo-frame {
          width: 100%;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        .evidence-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .photo-footer {
          padding: 3px 8px;
          font-size: 9px;
          color: #94a3b8;
          background: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-photo-box {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 5px;
          padding: 18px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          font-size: 11px;
        }

        .audit-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 8px 12px;
          margin-top: 10px;
          page-break-inside: avoid;
        }

        .audit-title {
          font-size: 10.5px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 3px;
        }

        .audit-desc {
          font-size: 9.5px;
          color: #64748b;
          line-height: 1.4;
        }

        .doc-footer {
          margin-top: 10px;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">Parcel<span>Proof</span></div>
          <div class="brand-tagline">Delivery Evidence & Condition Report</div>
        </div>
        <div class="doc-meta">
          <div class="report-id-label">Report Reference</div>
          <div class="report-id-val">${proof.reportId}</div>
          <div class="generated-date">Recorded: ${formattedDate}</div>
        </div>
      </div>

      <div class="summary-banner">
        <div class="banner-text">
          <strong>Delivery Evidence Record</strong> | Order: <strong>${proof.orderId || 'Unspecified'}</strong> | Carrier: <strong>${proof.courier || 'Unspecified'}</strong>
        </div>
        <div class="status-badge">${proof.status}</div>
      </div>

      <div class="section">
        <div class="section-header">📦 Parcel & Delivery Specification</div>
        <table class="data-table">
          <tr>
            <td class="cell-label">Order ID</td>
            <td class="cell-val bold">${proof.orderId}</td>
            <td class="cell-label">Report ID</td>
            <td class="cell-val"><code>${proof.reportId}</code></td>
          </tr>
          <tr>
            <td class="cell-label">Courier / Carrier</td>
            <td class="cell-val">${proof.courier || 'Not specified'}</td>
            <td class="cell-label">Current Status</td>
            <td class="cell-val">${proof.status}</td>
          </tr>
          <tr>
            <td class="cell-label">Parcel Condition</td>
            <td class="cell-val"><span class="condition-pill">${proof.condition}</span></td>
            <td class="cell-label">Record Created</td>
            <td class="cell-val">${formattedDate}</td>
          </tr>
          ${proof.capturedAt ? `
          <tr>
            <td class="cell-label">Captured Timestamp</td>
            <td class="cell-val" colspan="3">${formatReportDateTime(proof.capturedAt)}</td>
          </tr>` : ''}
          ${proof.description ? `
          <tr>
            <td class="cell-label">Issue Details</td>
            <td class="cell-val" colspan="3">
              <div class="desc-box">${proof.description}</div>
            </td>
          </tr>` : ''}
        </table>
      </div>

      <div class="section">
        <div class="section-header">📍 Location & Verification Coordinates</div>
        <table class="data-table">
          <tr>
            <td class="cell-label">Delivery Address</td>
            <td class="cell-val" colspan="3">${displayAddress}</td>
          </tr>
          <tr>
            <td class="cell-label">GPS Latitude</td>
            <td class="cell-val">${hasGps ? proof.latitude : '<span class="gps-unavailable-text">GPS location unavailable</span>'}</td>
            <td class="cell-label">GPS Longitude</td>
            <td class="cell-val">
              ${hasGps
      ? `${proof.longitude}<span class="gps-badge gps-verified">✓ GPS Verified</span>`
      : '<span class="gps-unavailable-text">GPS location unavailable</span><span class="gps-badge gps-missing">No GPS</span>'}
            </td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-header">📸 Photographic Evidence (${photoCount} item${photoCount !== 1 ? 's' : ''})</div>
        ${photoHtml}
      </div>

      <div class="audit-section">
        <div class="audit-title">Digital Evidence Record</div>
        <div class="audit-desc">
          This document contains delivery evidence and verification information recorded by the ParcelProof application.
          Timestamps, condition details, and uploaded photo evidence are associated with this report under Report ID: <strong>${proof.reportId}</strong>.
        </div>
      </div>

      <div class="doc-footer">
        Generated by ParcelProof • Delivery Evidence System • Document ID: ${proof.reportId}
      </div>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) { }
        }, 3000);
      }, 500);

      return;
    } catch (webErr) {
      console.error('Web print error:', webErr);
      const printWindow = window.open('', '_blank');

      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      return;
    }
  }

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `ParcelProof Evidence Report — ${proof.reportId}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
}