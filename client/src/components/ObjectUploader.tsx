import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
// CSS imports removed to avoid bundling issues - styles can be added via CDN or custom CSS
import AwsS3 from "@uppy/aws-s3";
import Webcam from "@uppy/webcam";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  enableCamera?: boolean;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  enableCamera = true,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      });

    // Add webcam plugin if camera is enabled and supported
    if (enableCamera && navigator.mediaDevices) {
      try {
        uppyInstance.use(Webcam, {
          countdown: 3,
          mirror: true,
          videoConstraints: {
            facingMode: 'user' // Use front camera by default for selfies
          },
          modes: ['picture'],
          locale: {
            strings: {
              smile: 'Smile!',
              takePicture: 'Take photo',
              allowAccessTitle: 'Please allow access to your camera',
              allowAccessDescription: 'In order to take pictures with your camera, please allow camera access for this site.',
            }
          }
        });
      } catch (error) {
        console.warn('Webcam plugin initialization failed:', error);
      }
    }

    return uppyInstance;
  });

  const handleOpenModal = () => {
    if (enableCamera) {
      // Check camera permissions
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(() => {
          setShowModal(true);
        })
        .catch((error) => {
          console.warn('Camera permission denied or not available:', error);
          toast({
            title: "Camera not available",
            description: "You can still upload photos from your gallery.",
            variant: "default"
          });
          setShowModal(true);
        });
    } else {
      setShowModal(true);
    }
  };

  return (
    <div>
      <Button onClick={handleOpenModal} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        plugins={enableCamera && navigator.mediaDevices ? ['Webcam'] : []}
        note="Images only, up to 10 MB"
      />
    </div>
  );
}
