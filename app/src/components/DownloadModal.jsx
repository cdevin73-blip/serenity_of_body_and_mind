import { useState } from "react";
import { generateClientReport, downloadTextFile } from "../lib/report";

export function DownloadModal({ client, journalData, onClose }) {
  const [downloading, setDownloading] = useState(false);

  function handleDownload(type) {
    setDownloading(true);
    setTimeout(() => {
      if (type === "full") {
        const report = generateClientReport(client, journalData);
        downloadTextFile(`serenity-wellness-report-${client.name.replace(/\s/g,"-").toLowerCase()}.txt`, report);
      } else if (type === "journal") {
        const entries = Object.entries(journalData).sort(([a],[b])=>b.localeCompare(a));
        const lines = ["SERENITY OF BODY AND MIND - Journal Export", `Client: ${client.name}`, ""];
        entries.forEach(([date, entry]) => {
          lines.push(`\n${date}`);
          lines.push("-".repeat(30));
          if (entry.intention) lines.push(`Intention: ${entry.intention}`);
          if (entry.reflection) lines.push(`Reflection: ${entry.reflection}`);
          if (entry.gratitude?.some(g=>g)) {
            lines.push("Gratitude:");
            entry.gratitude.filter(g=>g).forEach((g,i) => lines.push(`  ${i+1}. ${g}`));
          }
        });
        downloadTextFile(`serenity-journal-${client.name.replace(/\s/g,"-").toLowerCase()}.txt`, lines.join("\n"));
      } else if (type === "sleep-water") {
        const lines = ["SERENITY OF BODY AND MIND - Sleep & Water History", `Client: ${client.name}`, "", "Date,Sleep (hrs),Water (glasses)"];
        Object.entries(journalData).sort(([a],[b])=>a.localeCompare(b)).forEach(([date, d]) => {
          lines.push(`${date},${d.sleepHours||0},${d.waterGlasses||0}`);
        });
        downloadTextFile(`serenity-sleep-water-${client.name.replace(/\s/g,"-").toLowerCase()}.csv`, lines.join("\n"));
      }
      setDownloading(false);
      onClose();
    }, 600);
  }

  return (
    <div className="download-modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="download-modal">
        <h3>Download Your Data 📥</h3>
        <p>Your wellness data belongs to you. Choose what you'd like to download — you can come back and do this anytime.</p>
        <div className="download-options">
          <div className="download-option" onClick={()=>handleDownload("full")}>
            <span className="download-option-icon">📋</span>
            <div>
              <div className="download-option-name">Full Wellness Report</div>
              <div className="download-option-desc">Everything — habits, journal, food diary, gratitude, and reflections</div>
            </div>
          </div>
          <div className="download-option" onClick={()=>handleDownload("journal")}>
            <span className="download-option-icon">📓</span>
            <div>
              <div className="download-option-name">Journal & Reflections Only</div>
              <div className="download-option-desc">All daily intentions, reflections, and gratitude entries</div>
            </div>
          </div>
          <div className="download-option" onClick={()=>handleDownload("sleep-water")}>
            <span className="download-option-icon">📊</span>
            <div>
              <div className="download-option-name">Sleep & Water Data (CSV)</div>
              <div className="download-option-desc">Spreadsheet-ready sleep and water log — import into Excel or Google Sheets</div>
            </div>
          </div>
        </div>
        {downloading && <p style={{textAlign:"center",fontSize:13,color:"var(--terra)",marginBottom:14}}>Preparing your download…</p>}
        <button className="download-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
