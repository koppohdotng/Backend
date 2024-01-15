app.get('/teaser-pdf', async (req, res) => {
  
  const { userId,  url } = req.query;
      
  

  if (!userId || !url) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const pdfBuffer = await page.pdf();
    await browser.close();

    const fileName = `${userId}.pdf`;

    // Upload the PDF directly from memory to Firebase Storage
    const bucket = storagex.bucket();
    const file = bucket.file(`pdfs/${fileName}`);
    await file.save(pdfBuffer, {
      metadata: { contentType: 'application/pdf' },
    });

    // Get the signed URL for the uploaded PDF
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Replace with an appropriate expiration date
    });

    // Update the PDF URL in the Realtime Database
    const ref = db.ref(`/users/${userId}/teaser`);
    await ref.child('pdfUrl').set(signedUrl);

    res.status(200).json({ success: true, pdfUrl: signedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error'},error);
    res.status(503).json({ error: 'Internal server error1'},error);
  }
});

