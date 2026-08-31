import React, { useState, useEffect } from "react";
import { collection, db, doc, onSnapshot, query, setDoc, where } from "../../firebase";

import { Lock, ChevronRight, Play } from "lucide-react";
import { PackagePreviewView } from "./PackagePreviewView";
import { hasAccess as globalHasAccess } from "../../lib/accessControl";
import { showToast } from "../common/Toast";

export function StudentHierarchyView({
  currentUser,
  onOpenModule,
  assessmentPlanFilter,
  onSelectPurchaseItem,
  onRedirectToTab,
}) {
  const [nodes, setNodes] = useState([]);
  const [modules, setModules] = useState([]);
  const [currentNodeInfo, setCurrentNodeInfo] = useState({
    id: null,
    type: "general_branch",
    title: "Branches",
    node: null,
  });
  const [path, setPath] = useState([
    {
      id: null,
      type: "general_branch",
      title: "Branches",
      node: null,
    },
  ]);
  const [previewPackageItem, setPreviewPackageItem] = useState(null);
  const [accessRequestSent, setAccessRequestSent] = useState({});

  const getClosestPackage = (mod) => {
    if (
      mod &&
      mod.accessMode === "custom" &&
      mod.accessType &&
      ["premium_only", "purchasable_only", "premium_purchasable"].includes(
        mod.accessType,
      )
    ) {
      return { node: mod, type: "module" };
    }
    for (let i = path.length - 1; i >= 0; i--) {
      const p = path[i];
      if (
        p.node &&
        p.node.accessType &&
        ["premium_only", "purchasable_only", "premium_purchasable"].includes(
          p.node.accessType,
        )
      ) {
        let pType = "exam";
        if (p.type.includes("subject")) pType = "subject";
        else if (p.type.includes("topic")) pType = "topic";
        return { node: p.node, type: pType };
      }
    }
    if (
      currentNodeInfo.node &&
      currentNodeInfo.node.accessType &&
      ["premium_only", "purchasable_only", "premium_purchasable"].includes(
        currentNodeInfo.node.accessType,
      )
    ) {
      let pType = "exam";
      if (currentNodeInfo.type.includes("subject")) pType = "subject";
      else if (currentNodeInfo.type.includes("topic")) pType = "topic";
      return { node: currentNodeInfo.node, type: pType };
    }
    if (mod) return { node: mod, type: "module" };
    return null;
  };

  const submitAccessRequest = async (item, type) => {
    if (!currentUser) return;
    try {
      const reqId = crypto.randomUUID();
      await setDoc(doc(db, "access_requests", reqId), {
        id: reqId,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        userEmail: currentUser.email,
        itemId: item.id,
        itemType: type,
        itemName: item.name || item.title || "Unknown Item",
        status: "pending",
        createdAt: Date.now(),
      });
      setAccessRequestSent((prev) => ({ ...prev, [item.id]: true }));
      showToast("Access request submitted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit request.", "error");
    }
  };

  useEffect(() => {
    let unsubNodes = () => {};
    let unsubModules = () => {};

    if (currentNodeInfo.id) {
      // Always fetch modules for the current parent node if any exist
      const qMods = query(
        collection(db, "modules"),
        where("parentId", "==", currentNodeInfo.id),
      );
      unsubModules = onSnapshot(
        qMods,
        (snapshot) => {
          const fetchedMods = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          fetchedMods.sort((a, b) => a.createdAt - b.createdAt);
          setModules(fetchedMods);
        },
        (error) => console.error(error),
      );
    } else {
      setModules([]);
    }

    if (currentNodeInfo.type !== "module") {
      const qNodes = query(
        collection(db, "hierarchy_nodes"),
        where("parentId", "==", currentNodeInfo.id),
      );
      unsubNodes = onSnapshot(
        qNodes,
        (snapshot) => {
          const fetchedNodes = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              type: data.type,
              name: data.name || data.title,
            };
          });

          let filteredNodes = fetchedNodes;
          if (assessmentPlanFilter && currentNodeInfo.id === null && currentNodeInfo.type === "general_branch") {
            filteredNodes = fetchedNodes.filter((n) =>
              (assessmentPlanFilter.companyBranches || []).some((cb) => cb.branchId === n.id) ||
              (assessmentPlanFilter.learningContent || []).includes(n.id)
            );
          }

          filteredNodes.sort((a, b) => a.createdAt - b.createdAt);
          setNodes(filteredNodes);
        },
        (error) => console.error(error),
      );
    } else {
      setNodes([]);
    }

    return () => {
      unsubNodes();
      unsubModules();
    };
  }, [currentNodeInfo]);

  const [plans, setPlans] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "plans")), (snap) => {
      setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const hasAccess = (item, isModule = false) => {
    let type = isModule ? "module" : item.type;
    const activePlan = currentUser?.activePlanId
      ? plans.find((p) => p.id === currentUser.activePlanId)
      : null;
    return globalHasAccess(item, type, currentUser, path, activePlan, plans);
  };

  const handleUnlockItem = (item, isModule = false) => {
    if (!item) return;
    const itemType = isModule ? "module" : (item.type || (item === currentNodeInfo.node ? (currentNodeInfo.node.type || "general_branch") : "general_branch"));
    const normalizeType = (t) => {
      if (!t) return "module";
      if (t.includes("subject")) return "general_subject";
      if (t.includes("topic")) return "general_topic";
      if (t.includes("branch")) return "general_branch";
      return t;
    };
    const resolvedNormType = normalizeType(itemType);

    const pathIds = path.map((pt) => pt.id || (pt.node ? pt.node.id : null)).filter(Boolean);
    const allResourceIds = [item.id, ...pathIds];

    let matchedPlan = null;
    if (plans && plans.length > 0) {
      matchedPlan = plans.find((p) => {
        const compModsRaw = p.companyModules || p.company_modules || [];
        const compMods = Array.isArray(compModsRaw) ? compModsRaw : (typeof compModsRaw === "string" ? JSON.parse(compModsRaw || "[]") : []);
        const compBr = p.companyBranches || p.company_branches || [];
        const learnContRaw = p.learningContent || p.learning_content || [];
        const learnCont = Array.isArray(learnContRaw) ? learnContRaw : (typeof learnContRaw === "string" ? JSON.parse(learnContRaw || "[]") : []);

        if (resolvedNormType === "company") {
          return compMods.includes(item.id) || compBr.some((cb) => cb.companyId === item.id);
        } else if (resolvedNormType === "module") {
          const parentId = item.parentId || item.parent_id;
          if (item.moduleType === "company" || item.module_type === "company") {
            return compMods.includes(parentId) || compBr.some((cb) => cb.companyId === parentId);
          } else {
            return allResourceIds.some((id) => learnCont.includes(id));
          }
        } else {
          return allResourceIds.some((id) => learnCont.includes(id));
        }
      });
    }

    if (matchedPlan) {
      if (onSelectPurchaseItem && onRedirectToTab) {
        onSelectPurchaseItem(matchedPlan, "plan");
        onRedirectToTab("plans");
      }
    } else {
      const pkg = getClosestPackage(isModule ? item : null);
      if (pkg) {
        if (pkg.type === "company" && onSelectPurchaseItem && onRedirectToTab) {
          onSelectPurchaseItem(pkg.node, "company");
          onRedirectToTab("companies");
        } else {
          setPreviewPackageItem(pkg);
        }
      }
    }
  };

  const handleNodeClick = (node) => {
    let nextType = "module";
    if (node.type === "general_branch") nextType = "general_subject";
    else if (node.type === "general_subject") nextType = "general_topic";
    else if (node.type === "general_topic") nextType = "module";

    const nextInfo = {
      id: node.id,
      type: nextType,
      title: node.name,
      node: node,
    };
    setPath([...path, nextInfo]);
    setCurrentNodeInfo(nextInfo);
  };

  const jumpToPath = (index) => {
    const newPath = path.slice(0, index + 1);
    setPath(newPath);
    setCurrentNodeInfo(newPath[newPath.length - 1]);
  };

  if (previewPackageItem) {
    return (
      <PackagePreviewView
        packageNode={previewPackageItem.node}
        packageType={previewPackageItem.type}
        onBack={() => setPreviewPackageItem(null)}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs path navigator */}
      <div className="flex items-center space-x-2 text-sm text-slate-400 bg-[#0E1629] p-4 rounded-xl border border-slate-850 tracking-wide overflow-x-auto whitespace-nowrap custom-scrollbar">
        {path.map((step, idx) => (
          <React.Fragment key={idx}>
            <button
              onClick={() => jumpToPath(idx)}
              className={`transition-colors font-semibold uppercase tracking-wider text-xs ${
                idx === path.length - 1
                  ? "text-slate-100 cursor-default"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
              disabled={idx === path.length - 1}
            >
              {step.title}
            </button>
            {idx < path.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Unlock alert box */}
      {currentNodeInfo.node && !hasAccess(currentNodeInfo.node) && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <Lock className="w-6 h-6 text-amber-500 shrink-0 mr-3" />
            <div>
              <h4 className="font-bold text-amber-400 text-base">
                Unlock {currentNodeInfo.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Upgrade your membership plan or unlock this complete package to access all premium contents inside.
              </p>
            </div>
          </div>
          {currentNodeInfo.node.accessType === "access_request_only" ? (
            <button
              onClick={() => {
                let pType = "exam";
                if (currentNodeInfo.type.includes("subject")) pType = "subject";
                else if (currentNodeInfo.type.includes("topic")) pType = "topic";
                submitAccessRequest(currentNodeInfo.node, pType);
              }}
              disabled={accessRequestSent[currentNodeInfo.node.id]}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-600/10 whitespace-nowrap"
            >
              {accessRequestSent[currentNodeInfo.node.id] ? "Requested" : "Request Access"}
            </button>
          ) : (
            <button
              onClick={() => handleUnlockItem(currentNodeInfo.node)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-600/10 whitespace-nowrap"
            >
              Unlock Package
            </button>
          )}
        </div>
      )}

      {/* Subject / Topic child nodes grid */}
      {currentNodeInfo.type !== "module" && nodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {nodes.map((node) => {
            const access = hasAccess(node);
            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className={`relative bg-[#0E1629] border rounded-2xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[170px] ${
                  !access
                    ? "border-slate-800 hover:border-amber-500"
                    : "border-slate-800 hover:border-emerald-500"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black uppercase text-sm shadow-md ${
                        access
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                          : "bg-gradient-to-br from-amber-600 to-amber-700"
                      }`}
                    >
                      {node.name.charAt(0)}
                    </div>
                    {node.isPremium && !access && (
                      <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100 text-lg line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {node.name}
                  </h3>
                  {node.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {node.description}
                    </p>
                  )}
                </div>
                {node.isPremium && !access && (
                  <div className="mt-4 pt-3 border-t border-slate-850/50 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">Premium Content</span>
                    <button
                      type="button"
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline z-20 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        const pkg = getClosestPackage();
                        if (pkg) setPreviewPackageItem(pkg);
                      }}
                    >
                      Unlock Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Module assessment grid */}
      {(currentNodeInfo.type === "module" || modules.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const access = hasAccess(mod, true);
            return (
              <div
                key={mod.id}
                className="bg-[#0E1629] border border-slate-850 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between h-full relative group hover:border-slate-700"
              >
                {mod.accessMode === "custom" ? (
                  mod.accessType &&
                  mod.accessType !== "free" && (
                    <div
                      className={`absolute top-0 right-0 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-bl-xl z-10 flex items-center ${
                        mod.accessType === "demo" ? "bg-indigo-600" : "bg-amber-600"
                      }`}
                    >
                      {["premium_only", "premium_purchasable"].includes(mod.accessType) && (
                        <Lock className="w-2.5 h-2.5 mr-1" />
                      )}
                      {mod.accessType === "premium_only"
                        ? `Premium`
                        : mod.accessType === "purchasable_only"
                        ? `Purchasable (₹${mod.price || 0})`
                        : mod.accessType === "premium_purchasable"
                        ? `Prem/Purch (₹${mod.price || 0})`
                        : "Demo"}
                    </div>
                  )
                ) : null}
                <div>
                  <h3 className="text-lg font-black text-slate-100 mb-2 leading-snug group-hover:text-emerald-400 transition-colors mt-2">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed line-clamp-3">
                    {mod.description}
                  </p>
                </div>
                <div>
                  {access ? (
                    <button
                      onClick={() => onOpenModule(mod, path)}
                      className="w-full flex items-center justify-center space-x-2 bg-[#17223b] text-white hover:bg-emerald-600 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Module</span>
                    </button>
                  ) : (mod.accessMode === "custom" &&
                      mod.accessType === "access_request_only") ||
                    ((!mod.accessMode || mod.accessMode === "inherit") &&
                      currentNodeInfo.node?.accessType === "access_request_only") ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        submitAccessRequest(mod, "module");
                      }}
                      disabled={accessRequestSent[mod.id]}
                      className="w-full flex items-center justify-center space-x-2 disabled:opacity-50 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-amber-500/20"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {accessRequestSent[mod.id] ? "Requested" : "Request Access"}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col space-y-2 mt-4">
                      {(() => {
                        const pkg = getClosestPackage(mod);
                        return (
                          <>
                            {(() => {
                              const nodeAny = pkg.node;
                              return nodeAny.name || nodeAny.title ? (
                                <p className="text-[10px] text-amber-500 font-semibold leading-tight">
                                  Included in <strong>{nodeAny.name || nodeAny.title}</strong> Package.
                                </p>
                              ) : null;
                            })()}
                            <button
                              onClick={() => handleUnlockItem(mod, true)}
                              className="w-full flex items-center justify-center space-x-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-amber-500/20"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unlock Package</span>
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {modules.length === 0 && currentNodeInfo.type === "module" && (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium">
              No learning modules available here yet.
            </div>
          )}
        </div>
      )}

      {currentNodeInfo.type !== "module" &&
        nodes.length === 0 &&
        modules.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-medium">
            No content found.
          </div>
        )}
    </div>
  );
}
