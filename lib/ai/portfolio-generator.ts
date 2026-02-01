import { ParsedResume } from "./resume-engine";

export type PortfolioTheme = "light" | "dark" | "neutral";

export function generatePortfolioHTML(data: ParsedResume, theme: PortfolioTheme = "light"): string {
  const themeStyles = {
    light: {
      bg: "#ffffff",
      text: "#1a1a1a",
      secondaryText: "#4a4a4a",
      accent: "#4f46e5",
      cardBg: "#f9fafb",
      border: "#e5e7eb",
    },
    dark: {
      bg: "#0f172a",
      text: "#f8fafc",
      secondaryText: "#94a3b8",
      accent: "#818cf8",
      cardBg: "#1e293b",
      border: "#334155",
    },
    neutral: {
      bg: "#f4f4f5",
      text: "#27272a",
      secondaryText: "#52525b",
      accent: "#18181b",
      cardBg: "#ffffff",
      border: "#e4e4e7",
    },
  };

  const s = themeStyles[theme];

  const css = `
    :root {
      --bg: ${s.bg};
      --text: ${s.text};
      --text-secondary: ${s.secondaryText};
      --accent: ${s.accent};
      --card-bg: ${s.cardBg};
      --border: ${s.border};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 0;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    section { margin-bottom: 5rem; }
    h1, h2, h3 { font-weight: 800; line-height: 1.2; }
    h1 { font-size: 3.5rem; margin-bottom: 1rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.5rem; margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); }
    p { margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 1.1rem; }
    
    .hero { padding: 8rem 0 4rem; }
    .hero p { font-size: 1.5rem; max-width: 600px; }
    
    .skills-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .skill-tag { 
      padding: 0.5rem 1rem; 
      background: var(--card-bg); 
      border: 1px solid var(--border); 
      border-radius: 8px; 
      font-size: 0.9rem; 
      font-weight: 500;
    }

    .timeline-item { margin-bottom: 3rem; position: relative; padding-left: 2rem; border-left: 2px solid var(--border); }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-date { font-size: 0.85rem; font-weight: 700; color: var(--accent); margin-bottom: 0.5rem; }
    .timeline-role { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
    .timeline-company { font-weight: 600; margin-bottom: 1rem; color: var(--text); }
    .timeline-bullets { list-style: none; }
    .timeline-bullets li { margin-bottom: 0.5rem; position: relative; padding-left: 1.25rem; color: var(--text-secondary); font-size: 1rem; }
    .timeline-bullets li::before { content: "→"; position: absolute; left: 0; color: var(--accent); }

    .projects-grid { display: grid; grid-template-cols: 1fr; gap: 2rem; }
    .project-card { padding: 2rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; }
    .project-title { font-size: 1.25rem; margin-bottom: 0.75rem; }
    .project-link { color: var(--accent); text-decoration: none; font-weight: 600; font-size: 0.9rem; }

    .contact-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .contact-link { color: var(--text); font-weight: 600; text-decoration: none; border-bottom: 2px solid var(--accent); padding-bottom: 2px; }
    
    @media (max-width: 640px) {
      h1 { font-size: 2.5rem; }
      .container { padding: 2rem 1.5rem; }
    }
  `;

  const skills = [
    ...data.skills.technical,
    ...data.skills.soft,
    ...data.skills.tools
  ];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personal_info.full_name} | Portfolio</title>
    <meta name="description" content="${data.professional_summary.substring(0, 160)}">
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <section class="hero">
            <h1>${data.personal_info.full_name}</h1>
            <p>${data.professional_summary}</p>
        </section>

        <section id="about">
            <h2>About</h2>
            <p>${data.personal_info.location} • ${data.personal_info.email}</p>
        </section>

        <section id="skills">
            <h2>Expertise</h2>
            <div class="skills-grid">
                ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
        </section>

        <section id="experience">
            <h2>Experience</h2>
            <div class="timeline">
                ${data.work_experience.map(exp => `
                    <div class="timeline-item">
                        <div class="timeline-date">${exp.duration}</div>
                        <div class="timeline-role">${exp.role}</div>
                        <div class="timeline-company">${exp.company}</div>
                        <ul class="timeline-bullets">
                            ${exp.bullet_points.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </section>

        ${data.projects.length > 0 ? `
        <section id="projects">
            <h2>Featured Projects</h2>
            <div class="projects-grid">
                ${data.projects.map(project => `
                    <div class="project-card">
                        <h3 class="project-title">${project.title}</h3>
                        <p>${project.description}</p>
                        ${project.link ? `<a href="${project.link}" class="project-link" target="_blank">View Project ↗</a>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <section id="education">
            <h2>Education</h2>
            ${data.education.map(edu => `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem;">${edu.degree}</h3>
                    <p style="margin-bottom: 0;">${edu.institution} • ${edu.year}</p>
                </div>
            `).join('')}
        </section>

        <section id="contact">
            <h2>Get in Touch</h2>
            <div class="contact-links">
                <a href="mailto:${data.personal_info.email}" class="contact-link">Email</a>
                ${data.personal_info.links.map(link => `
                    <a href="${link.url}" class="contact-link" target="_blank">${link.label}</a>
                `).join('')}
            </div>
        </section>
    </div>
</body>
</html>
  `;

  return html;
}
