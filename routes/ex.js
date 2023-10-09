// Function to generate a unique file name
function generateUniqueFileName(originalName) {
  const fileExtension = path.extname(originalName);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + fileExtension;
}

// Set up multer for file uploads
const storage = multer.memoryStorage({
  filename: (req, file, callback) => {
    // Check if a file was uploaded
    if (file) {
      const uniqueFileName = generateUniqueFileName(file.originalname);
      callback(null, uniqueFileName);
    } else {
      // No file was uploaded, use the original name
      callback(null, file.originalname);
    }
  },
});

// Create an endpoint for uploading PDF documents
app.post('/api/loanRequest', upload.fields([
  { name: 'businessPlan', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'cashFlowAnalysis', maxCount: 1 },
  { name: 'financial', maxCount: 1 },
]), (req, res) => {
  try {
    const {
      date,
      problem,
      solution,
      stage,
      currency,
      fundingAmount,
      useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
      financials,
    } = req.body;

    // Extract file objects from the request
    const businessPlanFile = req.files['businessPlan'] ? req.files['businessPlan'][0] : null;
    const bankStatementFile = req.files['bankStatement'] ? req.files['bankStatement'][0] : null;
    const cashFlowAnalysisFile = req.files['cashFlowAnalysis'] ? req.files['cashFlowAnalysis'][0] : null;
    const financialFile = req.files['financial'] ? req.files['financial'][0] : null;

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Push the new entry to the database
    const newEntryRef = entriesRef.push();
    const entryId = newEntryRef.key;

    // Store file URLs in the database if files are available
    const fileUrls = {};
    if (businessPlanFile) {
      fileUrls.businessPlan = `https://your-firebase-storage-url.com/${entryId}/businessPlan.pdf`;
    }
    if (bankStatementFile) {
      fileUrls.bankStatement = `https://your-firebase-storage-url.com/${entryId}/bankStatement.pdf`;
    }
    if (cashFlowAnalysisFile) {
      fileUrls.cashFlowAnalysis = `https://your-firebase-storage-url.com/${entryId}/cashFlowAnalysis.pdf`;
    }
    if (financialFile) {
      fileUrls.financial = `https://your-firebase-storage-url.com/${entryId}/financial.pdf`;
    }

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
      financials,
      fileUrls,
    };

    newEntryRef.set(entryData, (error) => {
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