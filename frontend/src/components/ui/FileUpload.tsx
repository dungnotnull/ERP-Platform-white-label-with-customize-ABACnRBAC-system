import {
  ChangeEvent,
  DragEvent,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Bounce, toast } from "react-toastify";
import { useTranslation } from "react-i18next";

interface FileUploadProps {
  className?: string;
  defaultImage?: string;
  onFileChange?: (file: File | null) => void;
  defaultFile?: File | null;
  placeholder?: ReactNode;
  maxSizeInMB?: number;
  onError?: (error: string) => void;
}

export interface FileUploadRef {
  handleClick: () => void;
  removeFile: () => void;
}

const placeholderDefault = (
  <svg
    width="56"
    height="45"
    viewBox="0 0 56 45"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask
      id="mask0_1385_14551"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="56"
      height="45"
    >
      <rect x="0.5" width="55" height="44.4853" rx="10" fill="#D9D9D9" />
    </mask>
    <g mask="url(#mask0_1385_14551)">
      <rect x="0.5" width="55" height="44.4853" rx="10" fill="#D9D9D9" />
      <path
        d="M19.5072 23.4559C11.5538 28.8481 -4.67659 39.7941 -5.9707 40.4412V48.125L64.8014 49.3383L69.6543 40.4412L40.5366 15.3677L26.3822 29.5221L19.5072 23.4559Z"
        fill="#C4C4C4"
      />
      <circle cx="17.8897" cy="11.7278" r="3.63971" fill="#C3C3C3" />
    </g>
  </svg>
);

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  (
    {
      onFileChange,
      defaultFile,
      defaultImage,
      placeholder = placeholderDefault,
      className,
      onError,
      maxSizeInMB = 1.5
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [preview, setPreview] = useState<string | null>(defaultImage ?? null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): boolean => {
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        const errorMessage = t("fileUpload.maxSizeError", {
          maxSize: maxSizeInMB,
          defaultValue: `File size must be less than ${maxSizeInMB}MB`
        });
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce
        });
        onError?.(errorMessage);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return false;
      }

      return true;
    };

    const handleFile = (selectedFile: File) => {
      if (!validateFile(selectedFile)) {
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      if (onFileChange) {
        onFileChange(selectedFile);
      }
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    };

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    const removeFile = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        setPreview(null);
        if (onFileChange) {
          onFileChange(null);
        }
      }
    };

    useEffect(() => {
      if (defaultFile) {
        handleFile(defaultFile);
      }
    }, [defaultFile]);

    useImperativeHandle(ref, () => ({
      handleClick,
      removeFile
    }));

    return (
      <div
        className={cn(
          `relative group border-2 border-dashed flex justify-center items-center bg-[#ECECEC] w-fit h-fit max-w-64 min-h-44 min-w-36 rounded-lg p-2 cursor-pointer transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`,
          className
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="max-w-full h-auto" />
            <span className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-[#ef444442] invisible group-hover:visible">
              <span
                className="w-10 h-10 inline-flex justify-center items-center rounded-full text-lg text-white bg-destructive"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <Trash2 className="w-6" />
              </span>
            </span>
          </>
        ) : (
          <>
            {placeholder}
            <div className="absolute bottom-1 text-xs text-gray-500">
              {t("fileUpload.maxSize", {
                maxSize: maxSizeInMB,
                defaultValue: `Max size: ${maxSizeInMB}MB`
              })}
            </div>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export default FileUpload;
