# PDF Reader with Chat Interface

This component provides a PDF reader with an integrated chat interface that allows users to:

1. Upload PDF documents
2. View the PDF content in a responsive viewer
3. Ask questions about the PDF content
4. Receive AI-generated responses based on the PDF content

## Features

- **PDF Upload**: Users can upload PDF files through a simple drag-and-drop interface or file selector
- **PDF Viewer**: Embedded PDF viewer with navigation controls
- **Chat Interface**: Real-time chat interface to interact with the PDF content
- **Responsive Layout**: Resizable panels that adapt to different screen sizes
- **AI Integration**: Backend integration with AI models to analyze PDF content and answer questions

## Technical Implementation

The page uses:

- ResizablePanelGroup for the layout
- PDF.js for rendering PDFs
- React hooks for state management
- Framer Motion for animations
- Tailwind CSS for styling

## Future Enhancements

- PDF annotation capabilities
- Saving chat history
- Exporting conversations
- Multiple PDF support
- Document summarization
- Highlighting relevant sections in the PDF based on chat context 