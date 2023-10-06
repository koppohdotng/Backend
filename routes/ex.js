app.post('/api/entries', (req, res) => {
  try {
    const {
      date,
      problem,
      solution,
      stage,
      currency,
      fundingAmount,
      useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
      financials
    } = req.body;

    const entryData = {
      date,
      problem,
      solution,
      stage,
      currency,
      fundingAmount,
      useOfFunds: {
        product,
        saleAndMarketing,
        researchAndDevelopment,
        capitalExpenditure,
        operation,
        other,
      },
      financials
    };

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Push the new entry to the database
    entriesRef.push(entryData, (error) => {
      if (error) {
        res.status(500).json({ error: 'Failed to store data in the database' });
      } else {
        res.status(201).json({ message: 'Data stored successfully' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});
