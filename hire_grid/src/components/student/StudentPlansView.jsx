import React from "react";
import { CreditCard, Lock } from "lucide-react";
import { PremiumPurchaseView } from "./PremiumPurchaseView";
import { isPlanVisibleToStudent } from "../../lib/accessControl";

export function StudentPlansView({
  plans = [],
  currentUser,
  purchaseItem,
  onSelectPurchaseItem,
  onBackFromPurchase,
  onStartAssessmentFlow,
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {purchaseItem?.type === "plan" ? (
        <PremiumPurchaseView
          itemId={purchaseItem.item.id}
          itemName={purchaseItem.item.name}
          itemType="plan"
          price={purchaseItem.item.price}
          durationMonths={
            purchaseItem.item.duration === "1_month" ? 1 :
            purchaseItem.item.duration === "3_months" ? 3 :
            purchaseItem.item.duration === "6_months" ? 6 :
            purchaseItem.item.duration === "9_months" ? 9 :
            purchaseItem.item.duration === "12_months" ? 12 :
            purchaseItem.item.duration === "lifetime" ? 999 : 1
          }
          plan={purchaseItem.item}
          onBack={onBackFromPurchase}
          currentUser={currentUser}
        />
      ) : (
        <div className="std-panel">
          <div className="flex items-center mb-6">
            <CreditCard className="h-6 w-6 mr-3 text-emerald-500" />
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">Premium Membership Plans</h2>
          </div>
          
          {plans.filter(p => isPlanVisibleToStudent(p, currentUser)).length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No active membership plans available at the moment.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.filter(p => isPlanVisibleToStudent(p, currentUser)).map((plan) => {
                const isPurchased = currentUser?.activePlanId === plan.id || currentUser?.active_plan_id === plan.id;
                const userExpiry = currentUser?.planExpiry || currentUser?.plan_expiry;
                const isNotExpired = !userExpiry || Date.now() <= Number(userExpiry);
                const isSubscriptionActive = isPurchased && isNotExpired;

                return (
                  <div
                    key={plan.id}
                    className="bg-[#050B14] rounded-2xl p-6 shadow-md border border-slate-850 flex flex-col justify-between hover:border-slate-750 hover:shadow-lg transition-all"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide">
                        {plan.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {(plan.duration || "free").replace("_", " ")}
                      </p>
                      <div className="text-3xl font-black text-emerald-400">
                        ₹{plan.price || 0}
                      </div>
                      
                      <ul className="text-xs text-slate-400 space-y-3 pt-4 border-t border-slate-850">
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          {(plan.learningContent || plan.learning_content || []).length} Learning Entitlements
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          {(plan.companyModules || plan.company_modules || []).length} Company Prep Modules
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          {(plan.freeDemoModules || plan.free_demo_modules || []).length} Free Demo tests
                        </li>
                      </ul>
                      
                      <div className="w-full mt-6 space-y-4 pt-2">
                        {isPurchased && (
                          <div className={`p-3 border rounded-xl text-xs ${isNotExpired ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                            <div className="flex justify-between items-center gap-2">
                              <span className={`font-bold uppercase tracking-wider text-[10px] ${isNotExpired ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isNotExpired ? "Purchased (Active)" : "Expired"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px] text-right">
                                {userExpiry 
                                  ? `${isNotExpired ? 'Expires' : 'Ended'}: ${new Date(Number(userExpiry)).toLocaleDateString()}`
                                  : "Lifetime"}
                              </span>
                            </div>
                          </div>
                        )}
                        {isSubscriptionActive ? (
                          <button
                            onClick={() => onStartAssessmentFlow(plan)}
                            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10"
                          >
                            Start Assessment
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectPurchaseItem(plan, "plan")}
                            disabled={plan.isActive === false || plan.is_active === false}
                            className={`w-full h-11 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm ${
                              (plan.isActive === false || plan.is_active === false)
                                ? "bg-slate-900 text-slate-600 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
                            }`}
                          >
                            {(plan.isActive === false || plan.is_active === false) ? "Unavailable" : "Subscribe Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
