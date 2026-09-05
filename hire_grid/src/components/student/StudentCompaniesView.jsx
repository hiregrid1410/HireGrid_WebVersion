import React from "react";
import { Building2, ArrowLeft, Info, BookOpen, Lock, FileText, Timer, ChevronRight, CheckCircle2 } from "lucide-react";
import { PremiumPurchaseView } from "./PremiumPurchaseView";

export const getCompanyPrice = (company, plans = []) => {
  if (!company) return 499;
  
  const explicitPrice = Number(company.price || company.cost);
  if (explicitPrice > 0) return explicitPrice;

  if (plans && plans.length > 0) {
    const compIdStr = String(company.id);
    const matchingPlan = plans.find((p) => {
      const cMods = (p.companyModules || p.company_modules || []).map(String);
      const lCont = (p.learningContent || p.learning_content || []).map(String);
      const cBranches = p.companyBranches || p.company_branches || [];
      const hasBranchMatch = cBranches.some((cb) => 
        (cb && (String(cb.companyId) === compIdStr || String(cb.company_id) === compIdStr)) ||
        String(cb) === compIdStr
      );
      return cMods.includes(compIdStr) || lCont.includes(compIdStr) || hasBranchMatch;
    });

    if (matchingPlan && Number(matchingPlan.price) > 0) {
      return Number(matchingPlan.price);
    }

    const anyPlan = plans.find((p) => Number(p.price) > 0);
    if (anyPlan) return Number(anyPlan.price);
  }

  return 499;
};

export const isPaidCompany = (company, plans = []) => {
  if (!company) return false;
  if (company.accessType === "free" || company.access_type === "free" || company.is_demo || company.isDemo) return false;
  return true;
};

export function StudentCompaniesView({
  companies = [],
  activeCompany,
  setActiveCompany,
  assessmentPlanFilter,
  hasAccessToCompany,
  hasItemAccess,
  modules = [],
  moduleScores = {},
  purchaseItem,
  onSelectPurchaseItem,
  onBackFromPurchase,
  submitAccessRequest,
  accessRequestSent = {},
  onStartModule,
  plans = [],
  currentUser = null,
}) {
  return (
    <div className="animate-in fade-in duration-300">
      {purchaseItem?.type === "company" ? (
        <PremiumPurchaseView
          itemId={purchaseItem.item.id}
          itemName={purchaseItem.item.name}
          itemType="company"
          price={getCompanyPrice(purchaseItem.item, plans)}
          onBack={onBackFromPurchase}
          currentUser={purchaseItem.currentUser || currentUser}
        />
      ) : !activeCompany ? (
        /* Company Directory View */
        <div className="std-panel">
          <div className="flex items-center mb-6">
            <Building2 className="h-6 w-6 mr-3 text-emerald-500" />
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">Company Exams Directory</h2>
          </div>
          
          {companies.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No company exam preparation paths available yet.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(assessmentPlanFilter
                ? companies.filter((c) =>
                    (assessmentPlanFilter.companyBranches || []).some(
                      (cb) => cb.companyId === c.id
                    )
                  )
                : companies
              ).map((c) => {
                const unlocked = hasAccessToCompany(c);
                const paid = isPaidCompany(c, plans);
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveCompany(c)}
                    className="bg-[#050B14] rounded-2xl p-6 border border-slate-850 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 transition-all group relative min-h-[180px]"
                  >
                    {unlocked ? (
                      <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase flex items-center border border-emerald-500/20 tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Unlocked
                      </div>
                    ) : paid ? (
                      <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase flex items-center border border-amber-500/20 tracking-wider">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Paid
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase flex items-center border border-blue-500/20 tracking-wider">
                        Free
                      </div>
                    )}

                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt={c.name}
                        className="w-16 h-16 object-contain mb-4 filter drop-shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                    <h3 className="font-bold text-slate-200 text-base group-hover:text-emerald-400 transition-colors">
                      {c.name}
                    </h3>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Company detail view */
        <div className="std-panel">
          <button
            onClick={() => setActiveCompany(null)}
            className="flex items-center text-xs font-bold text-slate-450 hover:text-emerald-400 transition-colors mb-6 uppercase tracking-wider gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-slate-850 pb-8 mb-8">
            {activeCompany.logoUrl ? (
              <img
                src={activeCompany.logoUrl}
                alt={activeCompany.name}
                className="w-24 h-24 object-contain rounded-2xl bg-white border border-slate-800 p-4 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-md">
                <Building2 className="w-12 h-12" />
              </div>
            )}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
                {activeCompany.name} Prep Module
              </h2>
              {activeCompany.description && (
                <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-850 mt-4">
                  <h3 className="font-bold text-slate-350 mb-2 flex items-center text-xs uppercase tracking-wider gap-2">
                    <Info className="w-4 h-4 text-emerald-500" />
                    About placement criteria
                  </h3>
                  <div className="text-slate-400 leading-relaxed text-xs font-medium whitespace-pre-wrap">
                    {activeCompany.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-base uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              Company Assessments
            </h3>
          </div>

          {!hasAccessToCompany(activeCompany) && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <Lock className="w-6 h-6 text-amber-500 shrink-0 mr-3" />
                <div>
                  <h4 className="font-bold text-amber-400 text-sm">
                    Unlock {activeCompany.name} Assessments
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    This company path is premium. Unlock it to practice all company assessment questions.
                  </p>
                </div>
              </div>
              {activeCompany.accessType === "access_request_only" ? (
                <button
                  onClick={() => submitAccessRequest(activeCompany, "company")}
                  disabled={accessRequestSent[activeCompany.id]}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-600/10 whitespace-nowrap"
                >
                  {accessRequestSent[activeCompany.id] ? "Requested" : "Request Access"}
                </button>
              ) : (
                <button
                  onClick={() => onSelectPurchaseItem(activeCompany, "company")}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-600/10 whitespace-nowrap"
                >
                  Unlock for ₹{getCompanyPrice(activeCompany, plans)}
                </button>
              )}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {modules
              .filter(
                (m) =>
                  m.parentId &&
                  String(m.parentId) === String(activeCompany.id) &&
                  (!assessmentPlanFilter ||
                    (assessmentPlanFilter.companyBranches || []).some(
                      (cb) => cb.companyId === activeCompany.id && cb.branchId === m.branchId
                    ))
              )
              .map((mod) => {
                const prevScore = moduleScores[mod.id];
                const hasCompleted = prevScore !== undefined;
                const isPassed = hasCompleted && prevScore >= (mod.passPercentage || 0);
                const access = hasItemAccess(mod, "module");

                return (
                  <div
                    key={mod.id}
                    className="p-6 border border-slate-850 rounded-2xl hover:border-slate-700 bg-[#050B14] flex flex-col justify-between relative overflow-hidden min-h-[220px]"
                  >
                    {mod.accessMode === "custom" && mod.accessType && mod.accessType !== "free" && (
                      <div className="absolute top-0 right-0 bg-amber-600 text-white text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-bl-lg">
                        Premium
                      </div>
                    )}
                    
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex flex-col">
                          <h5 className="font-bold text-slate-200 text-base leading-tight">
                            {mod.title}
                          </h5>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1.5">
                            {mod.category}
                          </span>
                        </div>
                        {hasCompleted && (
                          <span
                            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isPassed ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {isPassed ? "Passed" : "Failed"} ({prevScore}%)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 my-4 line-clamp-3 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-850/50">
                      <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1"><FileText size={12} /> {mod.questions?.length || 0} Qs</span>
                        <span className="flex items-center gap-1"><Timer size={12} /> {mod.timeLimit || 30} mins</span>
                        <span>Pass: {mod.passPercentage || 60}%</span>
                      </div>

                      {access ? (
                        <button
                          onClick={() => onStartModule(mod)}
                          className="w-full flex items-center justify-center space-x-2 bg-[#17223b] text-white hover:bg-emerald-600 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                        >
                          <span>{hasCompleted ? "Retake Exam" : "Start Exam"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (mod.accessMode === "custom" && mod.accessType === "access_request_only") ||
                        ((!mod.accessMode || mod.accessMode === "inherit") &&
                          activeCompany?.accessType === "access_request_only") ? (
                        <button
                          onClick={() => submitAccessRequest(mod, "module")}
                          disabled={accessRequestSent[mod.id]}
                          className="w-full flex items-center justify-center space-x-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-amber-500/20"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{accessRequestSent[mod.id] ? "Requested" : "Request Access"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!mod.accessMode || mod.accessMode === "inherit") {
                              onSelectPurchaseItem(activeCompany, "company");
                            } else {
                              onSelectPurchaseItem(mod, "module");
                            }
                          }}
                          className="w-full flex items-center justify-center space-x-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-amber-500/20"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock module</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {modules.filter(
              (m) =>
                m.parentId &&
                String(m.parentId) === String(activeCompany.id)
            ).length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 text-sm">
                No exam modules loaded for {activeCompany.name} yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
