require('dotenv').config();
const express = require('express');
const contentful = require('contentful-management');

const app = express();
const PORT = process.env.PORT || 3000;

const {
  CONTENTFUL_MANAGEMENT_TOKEN,
  CONTENTFUL_SPACE_ID,
  CONTENTFUL_ENVIRONMENT_ID
} = process.env;

if (!CONTENTFUL_MANAGEMENT_TOKEN || !CONTENTFUL_SPACE_ID || !CONTENTFUL_ENVIRONMENT_ID) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

app.use(express.json());

async function enforceSeoDescriptionRequired() {
  try {
    const client = contentful.createClient({
      accessToken: CONTENTFUL_MANAGEMENT_TOKEN
    });

    console.log('Connecting to Contentful...');

    const space = await client.getSpace(CONTENTFUL_SPACE_ID);
    if (!space) {
      console.error('Space not found. Please check your SPACE_ID.');
      return;
    }
    if(CONTENTFUL_ENVIRONMENT_ID === 'master') {
      console.warn('master envireonment should not be used for testing.Please check your ENVIRONMENT_ID.');
      return;

    }
    const environment = await space.getEnvironment(CONTENTFUL_ENVIRONMENT_ID);
    if (!environment) {
      console.error('Environment not found. Please check your ENVIRONMENT_ID.');
      return;
    }
    

    console.log(`Connected to environment: ${CONTENTFUL_ENVIRONMENT_ID}`);

    const contentTypes = await environment.getContentTypes();
    console.log(`Fetched ${contentTypes.items.length} content type(s).`);

    let updatedCount = 0;
    let publishedCount = 0;

    for (const contentType of contentTypes.items) {
      const seoField = contentType.fields.find(
        (field) => field.id === 'seoDescription'
      );
      
      if (seoField) {
        console.log(`seoDescription field found in content type: ${contentType?.name}`);

        if (!seoField.required) {
          console.log(`Updating Content Type: ${contentType.name}`);

          seoField.required = true;

          try {
          const updatedContentType = await contentType.update();
          updatedCount++;
          }catch (updateError) {
            console.error(`Failed to update content type: ${contentType.name}. Error: ${updateError.message}`);
            continue; // Skip to the next content type
          }

          try{
            await updatedContentType.publish();
            publishedCount++;
            console.log(`Published updated Content Type: ${contentType.name}`);
          }catch (publishError) {
            console.error(`Failed to publish content type: ${contentType.name}. Error: ${publishError.message}`);
            continue; // Skip to the next content type
          }
          
        } else {
          console.log(`seoDescription is already required for content type: ${contentType.name}`);
        }
      }
    }

    console.log(`Completed! Updated ${updatedCount}, published ${publishedCount} content type(s).`);
  } catch (error) {
    console.error('Error occurred:', error.message);
    throw error;
  }
}

app.post('/enforceSeoDescriptionRequired', async (req, res) => {
  try {
    await enforceSeoDescriptionRequired();
    res.status(200).json({ 
      success: true, 
      message: 'SEO Description enforcement completed successfully.' 
    });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`POST ${PORT}/enforceSeoDescriptionRequired - Enforce SEO Description as required`);
});
