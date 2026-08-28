import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const [hero, about, stack, projects, journey, contact] = await Promise.all([
  read('sections/hero.html'),
  read('sections/about.html'),
  read('sections/stack.html'),
  read('sections/projects.html'),
  read('sections/journey.html'),
  read('sections/contact.html')
]);

const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080808">
  <meta name="description" content="Jude Mawad is a computer science student, digital designer, and app developer focused on useful mobile experiences.">
  <title>Jude Mawad — Digital Designer &amp; App Developer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Instrument+Sans:wght@400;500;600;700;800&amp;family=Instrument+Serif:ital@0;1&amp;display=swap" rel="stylesheet">
  <link rel="preload" href="images/portrait.png" as="image">
  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/hero.css">
  <link rel="stylesheet" href="styles/about.css">
  <link rel="stylesheet" href="styles/stack.css">
  <link rel="stylesheet" href="styles/projects-section.css">
  <link rel="stylesheet" href="styles/journey.css">
  <link rel="stylesheet" href="styles/contact-section.css">
</head>
<body>
  <a class="skip-link" href="#about">Skip to content</a>
  <div class="scroll-progress" aria-hidden="true"></div>
  <div class="site-grid" aria-hidden="true"></div>
  <div class="cursor-dot" aria-hidden="true"></div>
  <div class="cursor-ring" aria-hidden="true"></div>

  <!-- Hero and global navigation -->
${hero.trim()}

  <main id="main-content">
    <!-- About -->
${about.trim()}

    <!-- Stack -->
${stack.trim()}

    <!-- Projects -->
${projects.trim()}

    <!-- Journey -->
${journey.trim()}

    <!-- Contact and footer -->
${contact.trim()}
  </main>

  <script src="section-scripts/site.js"></script>
  <script src="section-scripts/hero.js"></script>
  <script src="section-scripts/stack.js"></script>
  <script src="section-scripts/projects.js"></script>
  <script src="section-scripts/journey.js"></script>
</body>
</html>
`;

await writeFile(path.join(root, 'index.html'), document);
console.log('Built index.html from six reviewed section fragments.');
