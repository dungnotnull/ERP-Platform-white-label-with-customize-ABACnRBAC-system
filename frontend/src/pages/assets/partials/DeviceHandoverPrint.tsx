import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { DEVICE_HANDOVER_PRINT_VI as vi } from "./deviceHandoverPrint.vi";

const DOCUMENT_FONT_FAMILY = '"Times New Roman", Times, serif';
interface DeviceManufacturer {
  id: string;
  name: string;
}

interface Device {
  id: string;
  serialNumber: string;
  name: string;
  deviceType?: {
    id: string;
    name: string;
  };
  manufacturer?: DeviceManufacturer | string;
  status?: { id: string; name: string } | string;
}

interface DeviceHandoverProps {
  type: "handover" | "return";
  giver: string;
  receiver: string;
  department?: string;
  date: Date;
  devices: Device[];
  notes?: string;
  onClose?: () => void;
}

export default function DeviceHandoverPrint({
  type,
  giver: _giver,
  receiver: _receiver,
  department: _department,
  date: _date,
  devices,
  onClose
}: DeviceHandoverProps) {
  const { t } = useTranslation();
  const modalTitle =
    type === "handover"
      ? t("common.deviceHandoverCard")
      : t("common.deviceReturnCard");
  const documentTitle = type === "handover" ? vi.handoverTitle : vi.returnTitle;

  const renderSignatureBlock = (title: string) => (
    <p style={{ fontWeight: 600, margin: 0 }}>
      {title}
      <br />
      <span style={{ fontStyle: "italic", fontWeight: 400 }}>
        {vi.signatureNote}
      </span>
    </p>
  );

  const renderNamePositionRow = (nameValue: string) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "4px"
      }}
    >
      <div style={{ width: "50%" }}>
        {vi.mrMs}: {nameValue}
      </div>

      <div style={{ width: "50%" }}>
        {vi.position}: {vi.fieldPlaceholder}
      </div>
    </div>
  );

  const handlePrint = () => {
    const element = document.getElementById("handover-pdf");

    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;

    const textarea = clone.querySelector("textarea");

    if (textarea) {
      const noteText = textarea.value || "";

      const noteDiv = document.createElement("div");

      noteDiv.innerText = noteText;

      noteDiv.style.border = "1px solid #ccc";
      noteDiv.style.borderRadius = "6px";
      noteDiv.style.padding = "12px";
      noteDiv.style.margin = "12px 0";
      noteDiv.style.minHeight = "80px";
      noteDiv.style.whiteSpace = "pre-wrap";
      noteDiv.style.wordBreak = "break-word";
      noteDiv.style.fontSize = "14px";
      noteDiv.style.lineHeight = "1.6";

      textarea.replaceWith(noteDiv);
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>

          <style>
            body {
              font-family: ${DOCUMENT_FONT_FAMILY};
              padding: 20px;
              line-height: 1.5;
            }

            body, table, th, td, p, div, h2, strong, span {
              font-family: ${DOCUMENT_FONT_FAMILY};
            }

            .info-row {
              display: flex;
              align-items: flex-start;
              margin-bottom: 8px;
            }

            .info-label {
              width: 160px;
              min-width: 160px;
              font-weight: bold;
            }

            .info-value {
              flex: 1;
              word-break: break-word;
              white-space: pre-wrap;
            }

            .signature-name {
              white-space: nowrap;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: center;
            }

            th {
              background: #f3f4f6;
            }
          </style>
        </head>

        <body>
          ${clone.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-6 relative max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{modalTitle}</h1>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t("common.print")}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>

        <div
          id="handover-pdf"
          className="p-6 border rounded-md bg-white"
          style={{ fontFamily: DOCUMENT_FONT_FAMILY }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "14px"
            }}
          >
            <div style={{ width: "50%", textAlign: "left" }}>
              <div
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}
              >
                {vi.companyName}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontWeight: 400,
                  fontStyle: "italic"
                }}
              >
                {type === "handover" ? vi.handoverDocNo : vi.returnDocNo}
              </div>
            </div>

            <div
              style={{
                width: "50%",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}
              >
                {vi.nationalMotto}
              </div>

              <div
                style={{
                  fontWeight: 600,
                  marginTop: "4px"
                }}
              >
                {vi.independence}
              </div>

              <div
                style={{
                  marginTop: "4px",
                  borderBottom: "1px solid #000",
                  width: "180px",
                  marginLeft: "auto",
                  marginRight: "auto"
                }}
              />
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginBottom: "10px"
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                textTransform: "uppercase",
                textAlign: "center",
                width: "100%",
                margin: 0
              }}
            >
              {documentTitle}
            </h2>
            <p
              style={{
                marginTop: "12px",
                fontStyle: "italic",
                fontSize: "13px",
                textAlign: "right",
                paddingRight: "20px"
              }}
            >
              {vi.dateLine}
            </p>
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: "2",
              marginBottom: "10px"
            }}
          >
            {type === "handover" ? (
              <>
                <div>
                  <strong>I. {vi.giverParty}:</strong>
                </div>

                {renderNamePositionRow(vi.nameLinePlaceholder)}

                <div>
                  {vi.department}: {vi.fieldPlaceholder}
                </div>

                <div style={{ marginTop: "10px" }}>
                  <strong>II. {vi.receiverParty}:</strong>
                </div>

                {renderNamePositionRow(vi.nameLinePlaceholder)}

                <div>
                  {vi.department}: {vi.fieldPlaceholder}
                </div>

                <div style={{ marginTop: "10px" }}>{vi.handoverIntro}</div>
              </>
            ) : (
              <>
                <div>
                  <strong>I. {vi.giverParty}:</strong>
                </div>

                {renderNamePositionRow(vi.nameLinePlaceholder)}

                <div>
                  {vi.department}: {vi.fieldPlaceholder}
                </div>

                <div style={{ marginTop: "10px" }}>
                  <strong>II. {vi.receiverParty}:</strong>
                </div>

                {renderNamePositionRow(vi.nameLinePlaceholder)}

                <div style={{ marginTop: "10px" }}>{vi.returnIntro}</div>
              </>
            )}
          </div>

          <table className="w-full table-fixed neumorphic-table text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 w-[60px]">{vi.no}</th>
                <th className="border p-2">{vi.assetName}</th>
                <th className="border p-2">{vi.unit}</th>
                <th className="border p-2">{vi.quantity}</th>
                <th className="border p-2">
                  {type === "handover" ? vi.assetCondition : vi.statusDevice}
                </th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => (
                <tr key={d.id || i}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2 break-words text-center">
                    {d.name || "-"}
                  </td>
                  <td className="border p-2 text-center"> </td>
                  <td className="border p-2 text-center">1</td>
                  <td className="border p-2 text-center"> </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: "14px",
              fontSize: "14px",
              lineHeight: "1.8",
              textAlign: "justify"
            }}
          >
            <p>
              {type === "handover"
                ? vi.handoverCommitment
                : vi.returnCommitment}
            </p>

            <p style={{ marginTop: "10px" }}>{vi.commitmentCopies}</p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
              textAlign: "center",
              fontSize: "14px",
              gap: "40px"
            }}
          >
            <div style={{ flex: 1, paddingBottom: "10px" }}>
              {renderSignatureBlock(
                type === "return"
                  ? vi.receiveReturnTitle
                  : vi.handoverPersonTitle
              )}

              <div style={{ height: "86px" }} />

              <p
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  paddingBottom: "10px"
                }}
              />
            </div>

            <div style={{ flex: 1, paddingBottom: "10px" }}>
              {renderSignatureBlock(
                type === "return" ? vi.returnerTitle : vi.receiverPersonTitle
              )}

              <div style={{ height: "86px" }} />

              <p
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  paddingBottom: "10px"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
