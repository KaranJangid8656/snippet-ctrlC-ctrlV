const mongoose = require('mongoose');
require('dotenv').config();
const Snippet = require('./models/Snippet');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snippetsaver';

const sampleSnippets = [
    {
        title: 'React UseEffect fetching data',
        content: `useEffect(() => {\n  const fetchData = async () => {\n    const res = await fetch('/api/data');\n    const data = await res.json();\n    setData(data);\n  };\n  fetchData();\n}, []);`,
        tags: ['react', 'hook', 'frontend'],
        language: 'javascript',
        favorite: true,
    },
    {
        title: 'Python simple Flask server',
        content: `from flask import Flask\napp = Flask(__name__)\n\n@app.route('/')\ndef hello():\n    return "Hello World!"\n\nif __name__ == '__main__':\n    app.run()`,
        tags: ['python', 'backend', 'api'],
        language: 'python',
        favorite: false,
    },
    {
        title: 'Center a div horizontally and vertically',
        content: `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}`,
        tags: ['css', 'flexbox', 'layout'],
        language: 'css',
        favorite: true,
    },
    {
        title: 'HTML5 Boilerplate starter',
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`,
        tags: ['html', 'starter'],
        language: 'html',
        favorite: false,
    },
    {
        title: 'SQL find duplicate emails',
        content: `SELECT Email\nFROM Person\nGROUP BY Email\nHAVING count(Email) > 1;`,
        tags: ['sql', 'database', 'query'],
        language: 'sql',
        favorite: false,
    },
    {
        title: 'JS array deduplication',
        content: `const uniqueArray = [...new Set(myArray)];`,
        tags: ['javascript', 'array', 'utility'],
        language: 'javascript',
        favorite: true,
    },
    {
        title: 'Basic Markdown table',
        content: `| Syntax      | Description |\n| ----------- | ----------- |\n| Header      | Title       |\n| Paragraph   | Text        |`,
        tags: ['documentation', 'markdown'],
        language: 'markdown',
        favorite: false,
    },
    {
        title: 'Fetch API POST request',
        content: `const response = await fetch('/api', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ key: 'value' })\n});`,
        tags: ['javascript', 'api', 'frontend'],
        language: 'javascript',
        favorite: false,
    },
    {
        title: 'Python read file contents',
        content: `with open('file.txt', 'r') as file:\n    data = file.read()`,
        tags: ['python', 'filesystem'],
        language: 'python',
        favorite: true,
    },
    {
        title: 'CSS Grid basic layout',
        content: `.grid-container {\n  display: grid;\n  grid-template-columns: 1fr 2fr;\n  gap: 20px;\n}`,
        tags: ['css', 'grid', 'layout'],
        language: 'css',
        favorite: false,
    }
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB.');

        // Clean existing to prevent old index conflicts
        await Snippet.deleteMany({});
        await Snippet.collection.dropIndexes().catch(() => console.log('No indexes to drop'));

        // Spread dates backward to simulate time passing for the 'lastSevenDays' chart
        const docs = sampleSnippets.map((s, idx) => ({
            ...s,
            createdAt: new Date(Date.now() - (idx * 16 * 60 * 60 * 1000)) // spreads them out over the past few days
        }));

        await Snippet.insertMany(docs);
        console.log(`Successfully seeded ${docs.length} snippets!`);
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seeding error:', err);
        process.exit(1);
    });
