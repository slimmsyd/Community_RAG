import { useState, useCallback } from 'react';
import { TransactionManager } from '@/lib/arweave/transaction';

interface UseArweaveUploadProps {
    userId: string;
    familyId: string;
}

interface UseArweaveUploadReturn {
    uploadFile: (file: File) => Promise<any>;
    uploadProgress: { progress: number } | null;
    isUploading: boolean;
    error: string | null;
}

export const useArweaveUpload = ({
    userId,
    familyId
}: UseArweaveUploadProps): UseArweaveUploadReturn => {
    const [uploadProgress, setUploadProgress] = useState<{ progress: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        console.log('Starting file upload:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId,
            familyId
        });

        setIsUploading(true);
        setError(null);
        setUploadProgress(null);

        try {
            console.log('Converting file to ArrayBuffer...');
            const buffer = await file.arrayBuffer();
            console.log('File converted:', {
                bufferSize: buffer.byteLength
            });

            console.log('Creating transaction...');
            const result = await TransactionManager.createTransaction(
                buffer,
                {
                    userId,
                    familyId,
                    contentType: file.type,
                    accessControl: [familyId],
                    originalOwner: userId
                },
                (progress) => {
                    console.log('Upload progress:', progress);
                    setUploadProgress({ progress });
                }
            );

            console.log('Transaction result:', result);

            if (result.status === 'error') {
                console.error('Upload failed:', result.message);
                setError(result.message || 'Upload failed');
            }

            return {
                status: result.status,
                transactionId: result.id,
                message: result.message
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            console.error('Upload error:', {
                error: err,
                errorMessage,
                errorStack: err instanceof Error ? err.stack : undefined
            });
            setError(errorMessage);
            return {
                status: 'error',
                transactionId: '',
                message: errorMessage
            };
        } finally {
            setIsUploading(false);
            console.log('Upload process completed');
        }
    }, [userId, familyId]);

    return {
        uploadFile,
        uploadProgress,
        isUploading,
        error
    };
}; 