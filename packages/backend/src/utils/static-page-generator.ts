export function generateStaticPage(pageContent: Record<string, any>): string {
  const { title = 'My No-Code Page', heading = 'Welcome!', body = 'This is a page generated from your content.', imageUrl } = pageContent;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
        .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
        h1 { color: #0056b3; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 15px; }
        p { line-height: 1.6; }
        .footer { margin-top: 30px; font-size: 0.8em; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${heading}</h1>
        ${imageUrl ? `<img src="${imageUrl}" alt="Page Image">` : ''}
        <p>${body}</p>
    </div>
    <div class="footer">
        <p>Powered by AI Service Platform</p>
    </div>
</body>
</html>
  `;
}
