import { Icon } from "@/components/layout/Icon";

interface RecommendationProps {
  companyName: string;
  type: "hot" | "warning";
  probability?: number | null;
  reason: string;
  suggestedAction: string;
  actionButton: string;
  onAction: () => void;
}

export function AiRecommendationCard({
  companyName,
  type,
  probability,
  reason,
  suggestedAction,
  actionButton,
  onAction
}: RecommendationProps) {
  const isHot = type === "hot";

  return (
    <div className={`mb-4 border-l-4 rounded-xl overflow-hidden bg-surface-container-lowest border ${isHot ? "border-l-error border-y-outline-variant border-r-outline-variant" : "border-l-secondary border-y-outline-variant border-r-outline-variant"}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-body-lg">
              {isHot ? "🔥" : "⚠"}
            </span>
            <h4 className="text-headline-sm font-bold text-primary">{companyName}</h4>
          </div>
          {probability && (
            <span className="bg-error-container text-error px-2 py-1 rounded text-label-md font-bold">
              {probability}% close probability
            </span>
          )}
        </div>

        <div className="mb-4">
          <p className="text-label-md font-semibold text-on-surface-variant uppercase mb-1">Reason:</p>
          <div className="text-body-md text-primary font-medium">
            {reason.split('\n').map((line, i) => (
              <p key={i} className="flex items-center gap-2">
                <Icon name="check_circle" className="text-primary/50 text-[14px]" /> {line}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-4 bg-surface-container-low p-3 rounded-lg border border-outline-variant">
          <p className="text-label-md font-semibold text-secondary uppercase mb-1">Suggested Action:</p>
          <p className="text-body-md text-primary">{suggestedAction}</p>
        </div>

        <button
          onClick={onAction}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-label-md font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Icon name={isHot ? "call" : "autorenew"} /> {actionButton}
        </button>
      </div>
    </div>
  );
}
