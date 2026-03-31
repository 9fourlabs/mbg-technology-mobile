import type { InformationalTemplate } from "../../src/templates/types";

export const bobsBurgersTemplate: InformationalTemplate = {
  "templateId": "informational",
  "brand": {
    "logoUri": "https://images-platform.99static.com//I3JpKD9n3ZIsfPA3LtRhXFM0xII=/356x344:1653x1641/fit-in/500x500/99designs-contests-attachments/156/156081/attachment_156081145",
    "primaryColor": "#7d24eb",
    "backgroundColor": "#0e1103",
    "textColor": "#FFFFFF",
    "mutedTextColor": "#999999"
  },
  "design": {
    "preset": "modern"
  },
  "tabs": [
    {
      "id": "home",
      "label": "Home",
      "headerTitle": "Home",
      "headerBody": "Short intro about this app.",
      "cards": [
        {
          "id": "hero",
          "imageUri": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
          "title": "Welcome",
          "body": "Describe what this app does for the client.",
          "action": {
            "type": "open_url",
            "url": "https://example.com",
            "label": "Learn more",
            "variant": "primary"
          }
        }
      ]
    }
  ]
};
