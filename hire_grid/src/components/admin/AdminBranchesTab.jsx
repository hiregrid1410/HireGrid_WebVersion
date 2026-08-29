import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  X,
  GitMerge,
  Building2,
  BookOpen,
  Trophy,
  Info,
  ChevronRight,
  ShieldCheck,
  Search,
  CheckSquare,
  Square,
  ListFilter,
} from "lucide-react";

export function AdminBranchesTab({ isContentManager = false, userName = "" }) {
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modules, setModules] = useState([]);
  const [hierarchyNodes, setHierarchyNodes] = useState([]);

  const [activeTab, setActiveTab] = useState("manage-branches"); // 'manage-branches' | 'mappings'
  const [mappingTab, setMappingTab] = useState("company"); // 'company' | 'learning' | 'mission'

  // Branch CRUD State
  const [branchForm, setBranchForm] = useState({
    id: "",
    name: "",
    code: "",
    description: "",
    status: "ACTIVE",
    isGeneral: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mappings Selection State (Supports Multi-Select)
  const [selectedEntityIds, setSelectedEntityIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [assignmentScope, setAssignmentScope] = useState("ALL"); // 'ALL' | 'SPECIFIC'
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);

  // Hierarchical Tree States
  const [cycles, setCycles] = useState([]);
  const [rootBranches, setRootBranches] = useState([]);
  const [nodeCache, setNodeCache] = useState({}); // { [parentId]: childrenList }
  const [expandedIds, setExpandedIds] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [loadingAllData, setLoadingAllData] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, companiesRes, rootNodesRes, cyclesRes] = await Promise.all([
        api.get("/branches"),
        api.get("/companies"),
        api.get("/hierarchy-nodes?where_parentId==:null"),
        api.get("/placement-mission/content-manager/cycles").catch(() => ({ success: false, cycles: [] }))
      ]);

      if (branchesRes.success) setBranches(branchesRes.branches || []);
      if (companiesRes.success) setCompanies(companiesRes.companies || []);
      if (rootNodesRes.success) {
        const rootNodes = (rootNodesRes.nodes || []).filter(n => n.type === "general_branch");
        setRootBranches(rootNodes);
      }
      if (cyclesRes.success) setCycles(cyclesRes.cycles || []);

      // Reset cache and selection
      setNodeCache({});
      setExpandedIds([]);
      setLoadingIds([]);
      setAllDataLoaded(false);
    } catch (err) {
      showToast("Error loading branch mapping data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Branch CRUD handlers
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code) {
      showToast("Branch name and code are required", "warning");
      return;
    }

    try {
      const url = branchForm.id ? `/branches/${branchForm.id}` : "/branches";
      const method = branchForm.id ? "PUT" : "POST";

      const res = await api[method.toLowerCase()](url, branchForm);
      if (res.success) {
        showToast(
          `Branch ${branchForm.id ? "updated" : "created"} successfully!`,
          "success"
        );
        resetBranchForm();
        fetchData();
      }
    } catch (err) {
      showToast("Failed to save branch: " + err.message, "error");
    }
  };

  const handleEditBranch = (branch) => {
    setBranchForm({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      description: branch.description || "",
      status: branch.status || "ACTIVE",
      isGeneral: !!branch.isGeneral,
    });
    setIsEditing(true);
  };

  const handleDeleteBranch = async (id, name) => {
    const ok = window.confirm(
      `Are you sure you want to delete the branch "${name}"? This will unlink all students and mappings.`
    );
    if (!ok) return;

    try {
      const res = await api.delete(`/branches/${id}`);
      if (res.success) {
        showToast("Branch deleted successfully", "success");
        fetchData();
      }
    } catch (err) {
      showToast("Failed to delete branch: " + err.message, "error");
    }
  };

  const resetBranchForm = () => {
    setBranchForm({
      id: "",
      name: "",
      code: "",
      description: "",
      status: "ACTIVE",
      isGeneral: false,
    });
    setIsEditing(false);
  };

  // Load mappings helper (when single item is selected)
  const loadSingleEntityMapping = async (id) => {
    try {
      if (mappingTab === "company") {
        const res = await api.get(`/companies/${id}/branches`);
        if (res.success && res.mappings) {
          const hasAll = res.mappings.some((m) => m.assignmentScope === "ALL");
          setAssignmentScope(hasAll ? "ALL" : "SPECIFIC");
          setSelectedBranchIds(
            res.mappings
              .filter((m) => m.assignmentScope === "SPECIFIC")
              .map((m) => m.branchId)
          );
        }
      } else {
        const type = mappingTab === "learning" ? "hierarchy_node" : "module";
        const res = await api.get(`/content-mappings/${type}/${id}`);
        if (res.success && res.mappings) {
          const hasAll = res.mappings.some((m) => m.assignmentScope === "ALL");
          setAssignmentScope(hasAll ? "ALL" : "SPECIFIC");
          setSelectedBranchIds(
            res.mappings
              .filter((m) => m.assignmentScope === "SPECIFIC")
              .map((m) => m.branchId)
          );
        }
      }
    } catch (err) {
      console.error("Failed to load mappings: ", err);
    }
  };

  // Handle singular & batch saves
  const handleSaveBatchMappings = async () => {
    if (selectedEntityIds.length === 0) {
      showToast("Please select at least one item to map", "warning");
      return;
    }

    setLoading(true);
    try {
      if (mappingTab === "company") {
        const companyIds = selectedEntityIds.filter(id => companies.some(c => c.id === id));
        const moduleIds = selectedEntityIds.filter(id => !companies.some(c => c.id === id));

        const promises = [];
        if (companyIds.length > 0) {
          promises.push(api.put("/companies-batch/branches", {
            companyIds,
            assignmentScope,
            branchIds: selectedBranchIds,
          }));
        }
        if (moduleIds.length > 0) {
          promises.push(api.put("/content-mappings-batch/module", {
            contentIds: moduleIds,
            assignmentScope,
            branchIds: selectedBranchIds,
          }));
        }

        await Promise.all(promises);
        showToast("Successfully assigned mappings!", "success");
      } else if (mappingTab === "learning") {
        const nodeIds = [];
        const moduleIds = [];

        for (const id of selectedEntityIds) {
          let isNode = rootBranches.some(b => b.id === id);
          if (!isNode) {
            for (const parentId of Object.keys(nodeCache)) {
              const item = nodeCache[parentId].find(x => x.id === id);
              if (item) {
                if (item.type && item.type.startsWith("general_")) {
                  isNode = true;
                }
                break;
              }
            }
          }
          if (isNode) {
            nodeIds.push(id);
          } else {
            moduleIds.push(id);
          }
        }

        const promises = [];
        if (nodeIds.length > 0) {
          promises.push(api.put("/content-mappings-batch/hierarchy_node", {
            contentIds: nodeIds,
            assignmentScope,
            branchIds: selectedBranchIds,
          }));
        }
        if (moduleIds.length > 0) {
          promises.push(api.put("/content-mappings-batch/module", {
            contentIds: moduleIds,
            assignmentScope,
            branchIds: selectedBranchIds,
          }));
        }

        await Promise.all(promises);
        showToast("Successfully assigned mappings!", "success");
      } else if (mappingTab === "mission") {
        const cycleIds = selectedEntityIds.filter(id => cycles.some(c => c.id === id));
        const moduleIds = selectedEntityIds.filter(id => !cycles.some(c => c.id === id));

        const promises = [];
        if (cycleIds.length > 0) {
          promises.push(api.put("/content-mappings-batch/cycle", {
            contentIds: cycleIds,
            assignmentScope,
            branchIds: selectedBranchIds,
          }));
        }
        if (moduleIds.length > 0) {
          promises.push(api.put("/content-mappings-batch/module", {
            contentIds: moduleIds,
            assignmentScope,
            branchIds: selectedBranchIds,
          }));
        }

        await Promise.all(promises);
        showToast("Successfully assigned mappings!", "success");
      }
    } catch (err) {
      showToast("Failed to save mappings: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleBranchSelection = (branchId) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  // Debounced/Local Search trigger
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      ensureAllDataLoadedForSearch();
    }
  }, [searchQuery]);

  const ensureAllDataLoadedForSearch = async () => {
    if (allDataLoaded || loadingAllData) return;
    setLoadingAllData(true);
    try {
      const [allNodesRes, allModulesRes] = await Promise.all([
        api.get("/hierarchy-nodes"),
        api.get("/modules")
      ]);
      if (allNodesRes.success && allModulesRes.success) {
        const nodes = allNodesRes.nodes || [];
        const mods = allModulesRes.modules || [];
        
        const newCache = { ...nodeCache };
        
        nodes.forEach(n => {
          if (n.parentId) {
            if (!newCache[n.parentId]) newCache[n.parentId] = [];
            if (!newCache[n.parentId].some(item => item.id === n.id)) {
              newCache[n.parentId].push(n);
            }
          }
        });

        mods.forEach(m => {
          const parentId = m.parentId || m.parent_id || m.cycleId || m.cycle_id;
          if (parentId) {
            if (!newCache[parentId]) newCache[parentId] = [];
            if (!newCache[parentId].some(item => item.id === m.id)) {
              newCache[parentId].push(m);
            }
          }
        });

        setNodeCache(newCache);
        setAllDataLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load search data:", err);
    } finally {
      setLoadingAllData(false);
    }
  };

  const getDescendants = (nodeId, type) => {
    const descendants = [];
    const queue = [{ id: nodeId, type }];
    while (queue.length > 0) {
      const current = queue.shift();
      const children = nodeCache[current.id] || [];
      children.forEach(child => {
        let childType = "";
        if (current.type === "company") childType = "module";
        else if (current.type === "cycle") childType = "module";
        else if (current.type === "general_branch") childType = "general_subject";
        else if (current.type === "general_subject") childType = "general_topic";
        else if (current.type === "general_topic") childType = "module";
        else childType = child.type || "module";

        descendants.push({ id: child.id, type: childType, name: child.name || child.title });
        queue.push({ id: child.id, type: childType });
      });
    }
    return descendants;
  };

  const ensureDescendantsLoaded = async (nodeId, type) => {
    if (type === "module") return;

    let children = nodeCache[nodeId];
    if (children === undefined) {
      try {
        let url = "";
        if (type === "company") {
          url = `/modules?where_moduleType==:company&where_parentId==:${nodeId}`;
        } else if (type === "general_branch") {
          url = `/hierarchy-nodes?where_parentId==:${nodeId}`;
        } else if (type === "general_subject") {
          url = `/hierarchy-nodes?where_parentId==:${nodeId}`;
        } else if (type === "general_topic") {
          url = `/modules?where_moduleType==:general&where_parentId==:${nodeId}`;
        } else if (type === "cycle") {
          url = `/modules?where_isPlacementMission==:true&where_cycleId==:${nodeId}`;
        }

        if (url) {
          const res = await api.get(url);
          if (res.success) {
            children = res.modules || res.nodes || [];
            nodeCache[nodeId] = children;
            setNodeCache(prev => ({
              ...prev,
              [nodeId]: children
            }));
          } else {
            children = [];
          }
        } else {
          children = [];
        }
      } catch (err) {
        console.error("Failed to load descendants:", err);
        children = [];
      }
    }

    const promises = [];
    children.forEach(child => {
      let childType = "";
      if (type === "company") childType = "module";
      else if (type === "cycle") childType = "module";
      else if (type === "general_branch") childType = "general_subject";
      else if (type === "general_subject") childType = "general_topic";
      else if (type === "general_topic") childType = "module";
      else childType = child.type || "module";

      promises.push(ensureDescendantsLoaded(child.id, childType));
    });

    await Promise.all(promises);
  };

  const handleToggleNode = async (nodeId, type, checkedState) => {
    if (checkedState && type !== "module") {
      setLoadingIds(prev => [...prev, nodeId]);
      await ensureDescendantsLoaded(nodeId, type);
      setLoadingIds(prev => prev.filter(id => id !== nodeId));
    }

    const descendants = getDescendants(nodeId, type);
    const descendantIds = descendants.map(d => d.id);

    setSelectedEntityIds(prev => {
      let updated = [...prev];
      if (checkedState) {
        updated = Array.from(new Set([...updated, nodeId, ...descendantIds]));
      } else {
        updated = updated.filter(id => id !== nodeId && !descendantIds.includes(id));
      }

      if (updated.length === 1) {
        loadSingleEntityMapping(updated[0]);
      } else if (updated.length === 0) {
        setAssignmentScope("ALL");
        setSelectedBranchIds([]);
      }
      return updated;
    });
  };

  const getNodeState = (nodeId, type) => {
    const children = nodeCache[nodeId] || [];
    if (children.length === 0) {
      return selectedEntityIds.includes(nodeId) ? "checked" : "unchecked";
    }

    let checkedCount = 0;
    let uncheckedCount = 0;

    children.forEach(child => {
      let childType = "";
      if (type === "company") childType = "module";
      else if (type === "cycle") childType = "module";
      else if (type === "general_branch") childType = "general_subject";
      else if (type === "general_subject") childType = "general_topic";
      else if (type === "general_topic") childType = "module";
      else childType = child.type || "module";

      const childState = getNodeState(child.id, childType);
      if (childState === "checked") checkedCount++;
      else if (childState === "unchecked") uncheckedCount++;
    });

    if (checkedCount === children.length) {
      return "checked";
    }
    if (uncheckedCount === children.length && !selectedEntityIds.includes(nodeId)) {
      return "unchecked";
    }
    return "indeterminate";
  };

  const expandNode = async (nodeId, type) => {
    if (expandedIds.includes(nodeId)) {
      setExpandedIds(prev => prev.filter(id => id !== nodeId));
      return;
    }

    setExpandedIds(prev => [...prev, nodeId]);
    if (nodeCache[nodeId] !== undefined) return;

    setLoadingIds(prev => [...prev, nodeId]);
    try {
      let url = "";
      if (type === "company") {
        url = `/modules?where_moduleType==:company&where_parentId==:${nodeId}`;
      } else if (type === "general_branch") {
        url = `/hierarchy-nodes?where_parentId==:${nodeId}`;
      } else if (type === "general_subject") {
        url = `/hierarchy-nodes?where_parentId==:${nodeId}`;
      } else if (type === "general_topic") {
        url = `/modules?where_moduleType==:general&where_parentId==:${nodeId}`;
      } else if (type === "cycle") {
        url = `/modules?where_isPlacementMission==:true&where_cycleId==:${nodeId}`;
      }

      if (url) {
        const res = await api.get(url);
        if (res.success) {
          const items = res.modules || res.nodes || [];
          setNodeCache(prev => ({
            ...prev,
            [nodeId]: items
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load children:", err);
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== nodeId));
    }
  };

  const matchesSearch = (node, type, query) => {
    if (!query) return true;
    const name = (node.name || node.title || "").toLowerCase();
    if (name.includes(query.toLowerCase())) return true;

    const children = nodeCache[node.id] || [];
    return children.some(child => {
      let childType = "";
      if (type === "company") childType = "module";
      else if (type === "cycle") childType = "module";
      else if (type === "general_branch") childType = "general_subject";
      else if (type === "general_subject") childType = "general_topic";
      else if (type === "general_topic") childType = "module";
      else childType = child.type || "module";

      return matchesSearch(child, childType, query);
    });
  };

  const shouldBeExpanded = (nodeId, type) => {
    if (expandedIds.includes(nodeId)) return true;
    if (searchQuery.trim() !== "") {
      const children = nodeCache[nodeId] || [];
      return children.some(child => {
        let childType = "";
        if (type === "company") childType = "module";
        else if (type === "cycle") childType = "module";
        else if (type === "general_branch") childType = "general_subject";
        else if (type === "general_subject") childType = "general_topic";
        else if (type === "general_topic") childType = "module";
        else childType = child.type || "module";
        return matchesSearch(child, childType, searchQuery);
      });
    }
    return false;
  };

  const handleSelectAllFiltered = () => {
    let idsToSelect = [];
    if (mappingTab === "company") {
      idsToSelect = companies.map(c => c.id);
    } else if (mappingTab === "learning") {
      idsToSelect = rootBranches.map(b => b.id);
    } else if (mappingTab === "mission") {
      idsToSelect = cycles.map(c => c.id);
    }

    setSelectedEntityIds(prev => {
      const merged = Array.from(new Set([...prev, ...idsToSelect]));
      if (merged.length === 1) {
        loadSingleEntityMapping(merged[0]);
      }
      return merged;
    });
  };

  const handleDeselectAll = () => {
    setSelectedEntityIds([]);
    setAssignmentScope("ALL");
    setSelectedBranchIds([]);
  };

  const getSelectionSummaryText = () => {
    let companiesCount = 0;
    let modulesCount = 0;
    let subjectsCount = 0;
    let topicsCount = 0;
    let cyclesCount = 0;
    let branchesCount = 0;

    selectedEntityIds.forEach(id => {
      if (companies.some(c => c.id === id)) {
        companiesCount++;
      } else if (cycles.some(cy => cy.id === id)) {
        cyclesCount++;
      } else if (rootBranches.some(b => b.id === id)) {
        branchesCount++;
      } else {
        let found = false;
        for (const parentId of Object.keys(nodeCache)) {
          const item = nodeCache[parentId].find(x => x.id === id);
          if (item) {
            found = true;
            if (item.type === "general_subject" || item.type === "subject") {
              subjectsCount++;
            } else if (item.type === "general_topic" || item.type === "topic") {
              topicsCount++;
            } else {
              modulesCount++;
            }
            break;
          }
        }
      }
    });

    const parts = [];
    if (companiesCount > 0) parts.push(`${companiesCount} Co.`);
    if (cyclesCount > 0) parts.push(`${cyclesCount} Cycles`);
    if (branchesCount > 0) parts.push(`${branchesCount} Br.`);
    if (subjectsCount > 0) parts.push(`${subjectsCount} Sub.`);
    if (topicsCount > 0) parts.push(`${topicsCount} Topics`);
    if (modulesCount > 0) parts.push(`${modulesCount} Mod.`);

    return parts.length > 0 ? ` • ${parts.join(" • ")}` : "";
  };

  // Helper: resolve name, label, and color for a selected ID
  const getSelectedItemInfo = (id) => {
    const company = companies.find(c => c.id === id);
    if (company) return { name: company.name, label: "COMPANY", color: "emerald" };

    const cycle = cycles.find(cy => cy.id === id);
    if (cycle) return { name: cycle.name || cycle.title, label: "CYCLE", color: "purple" };

    const branch = rootBranches.find(b => b.id === id);
    if (branch) return { name: branch.name, label: "BRANCH", color: "blue" };

    for (const parentId of Object.keys(nodeCache)) {
      const item = nodeCache[parentId]?.find(x => x.id === id);
      if (item) {
        const name = item.name || item.title || "Unknown";
        if (item.type === "general_subject" || item.type === "subject") {
          return { name, label: "SUBJECT", color: "cyan" };
        } else if (item.type === "general_topic" || item.type === "topic") {
          return { name, label: "TOPIC", color: "indigo" };
        } else {
          return { name, label: "MODULE", color: "amber" };
        }
      }
    }
    return { name: id.slice(0, 8) + "...", label: "ITEM", color: "slate" };
  };

  const removeSelectedId = (id) => {
    setSelectedEntityIds(prev => {
      const updated = prev.filter(x => x !== id);
      if (updated.length === 0) {
        setAssignmentScope("ALL");
        setSelectedBranchIds([]);
      }
      return updated;
    });
  };

  // Recursive Tree Node Component
  function TreeNode({ node, type, depth }) {
    const isExpanded = shouldBeExpanded(node.id, type);
    const state = getNodeState(node.id, type);
    const isLoading = loadingIds.includes(node.id);
    const name = node.name || node.title || "";

    const children = nodeCache[node.id] || [];
    const hasChildren = type !== "module" && (children.length > 0 || !allDataLoaded);

    if (searchQuery.trim() !== "" && !matchesSearch(node, type, searchQuery)) {
      return null;
    }

    return (
      <div className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 16}px` }}
          className={`flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-xs font-bold transition-all border border-transparent ${
            state === "checked"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="flex items-center space-x-2 truncate">
            {/* Expand / Collapse Button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => expandNode(node.id, type)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 shrink-0"
              >
                {isLoading ? (
                  <span className="w-3 h-3 block border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                ) : isExpanded ? (
                  <span className="text-[10px] font-black text-slate-500">▼</span>
                ) : (
                  <span className="text-[10px] font-black text-slate-500">▶</span>
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0"></span> // Spacer for alignment
            )}

            {/* Checkbox Icon */}
            <button
              type="button"
              onClick={() => handleToggleNode(node.id, type, state !== "checked")}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 shrink-0"
            >
              {state === "checked" ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : state === "indeterminate" ? (
                <div className="w-4 h-4 flex items-center justify-center bg-emerald-500/20 border border-emerald-500 text-emerald-500 rounded font-black text-[12px] leading-none">-</div>
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>

            {/* Node Name */}
            <span className="truncate">{name}</span>
          </div>

          {/* Badge indicator */}
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-full shrink-0">
            {type.replace("general_", "")}
          </span>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 mt-0.5">
            {children.map(child => {
              let childType = "";
              if (type === "company") childType = "module";
              else if (type === "cycle") childType = "module";
              else if (type === "general_branch") childType = "general_subject";
              else if (type === "general_subject") childType = "general_topic";
              else if (type === "general_topic") childType = "module";
              else childType = child.type || "module";

              return (
                <TreeNode
                  key={child.id}
                  node={child}
                  type={childType}
                  depth={depth + 1}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-emerald-500/20">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center">
            <GitMerge className="w-6 h-6 mr-2 text-emerald-500" />
            Branch & Access Mappings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure academic branches and map preparation modules, companies, and exams.
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("manage-branches")}
          className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === "manage-branches"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Manage Academic Branches
        </button>
        <button
          onClick={() => setActiveTab("mappings")}
          className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === "mappings"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Assign Content & Access
        </button>
      </div>

      {activeTab === "manage-branches" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch Form */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-fit space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              {isEditing ? <Edit2 className="w-5 h-5 mr-2 text-emerald-500" /> : <Plus className="w-5 h-5 mr-2 text-emerald-500" />}
              {isEditing ? "Edit Branch details" : "Add Academic Branch"}
            </h3>

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Engineering"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Branch Code (Short Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Academic description or details..."
                  value={branchForm.description}
                  onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={branchForm.status}
                  onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Onboard-ready)</option>
                  <option value="INACTIVE">INACTIVE (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="isGeneral"
                  checked={branchForm.isGeneral}
                  onChange={(e) => setBranchForm({ ...branchForm, isGeneral: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:outline-none"
                />
                <label htmlFor="isGeneral" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Set as Default System General Branch
                </label>
              </div>

              {branchForm.isGeneral && (
                <div className="flex bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Only one general branch can be set. This will automatically unset any other active general branch.</span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {branchForm.id ? "Update Details" : "Create Branch"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetBranchForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Branches List */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Academic Specialties List ({branches.length})
            </h3>

            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <thead>
                  <tr className="text-slate-500 text-left font-semibold">
                    <th className="pb-3 pr-4">Branch Code</th>
                    <th className="pb-3 px-4">Name</th>
                    <th className="pb-3 px-4">Default general?</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {branches.map((b) => (
                    <tr key={b.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 pr-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {b.code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {b.name}
                      </td>
                      <td className="py-3 px-4">
                        {b.isGeneral ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            General (Default)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            b.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditBranch(b)}
                          className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!b.isGeneral && (
                          <button
                            onClick={() => handleDeleteBranch(b.id, b.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">
                        No branches configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Batch Access Mappings View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Entities Selector Checklist */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col space-y-4 lg:col-span-1 min-h-[500px]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <ListFilter className="w-5 h-5 mr-2 text-emerald-500" />
              Targets selection
            </h3>

            {/* Mapping Type Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              <button
                onClick={() => {
                  setMappingTab("company");
                  handleDeselectAll();
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center space-y-0.5 ${
                  mappingTab === "company"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Companies</span>
              </button>
              <button
                onClick={() => {
                  setMappingTab("learning");
                  handleDeselectAll();
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center space-y-0.5 ${
                  mappingTab === "learning"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Learning</span>
              </button>
              <button
                onClick={() => {
                  setMappingTab("mission");
                  handleDeselectAll();
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center space-y-0.5 ${
                  mappingTab === "mission"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Placement</span>
              </button>
            </div>

            {/* Live search input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${mappingTab === "company" ? "companies" : mappingTab === "learning" ? "nodes" : "missions"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
            </div>

            {/* Select helpers */}
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 truncate max-w-[65%]">
                {selectedEntityIds.length} selected{getSelectionSummaryText()}
              </span>
              <div className="space-x-2 shrink-0">
                <button
                  onClick={handleSelectAllFiltered}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-rose-500 hover:underline font-bold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Target Entities checklist box */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-[350px] custom-scrollbar space-y-2 bg-slate-50/50 dark:bg-slate-950/20">
              {loadingAllData && (
                <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                  <span>Loading hierarchy...</span>
                </div>
              )}

              {!loadingAllData && mappingTab === "company" && companies.map(company => (
                <TreeNode key={company.id} node={company} type="company" depth={0} />
              ))}

              {!loadingAllData && mappingTab === "learning" && rootBranches.map(branch => (
                <TreeNode key={branch.id} node={branch} type="general_branch" depth={0} />
              ))}

              {!loadingAllData && mappingTab === "mission" && cycles.map(cycle => (
                <TreeNode key={cycle.id} node={cycle} type="cycle" depth={0} />
              ))}

              {!loadingAllData && (
                (mappingTab === "company" && companies.length === 0) ||
                (mappingTab === "learning" && rootBranches.length === 0) ||
                (mappingTab === "mission" && cycles.length === 0)
              ) && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No targets found.
                </div>
              )}
            </div>
          </div>

          {/* Mappings Permissions & Bulk Assign Panel */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Permissions Assignment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedEntityIds.length === 1 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Showing current configuration for single item.
                      </span>
                    ) : selectedEntityIds.length > 1 ? (
                      <span className="text-amber-500 font-semibold">
                        Bulk editing {selectedEntityIds.length} items. Saving will overwrite their existing mappings.
                      </span>
                    ) : (
                      "Please select targets on the left to configure access."
                    )}
                  </p>
                </div>
                {assignmentScope === "ALL" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    Global Assignment Active
                  </span>
                )}
              </div>

              {/* Selected Targets Removable Chips */}
              {selectedEntityIds.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Selected Targets ({selectedEntityIds.length})
                    </span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-3 bg-slate-50/70 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-800">
                    {selectedEntityIds.map(id => {
                      const info = getSelectedItemInfo(id);
                      const colorMap = {
                        emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
                        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
                        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
                        cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
                        indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
                        amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
                        slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600",
                      };
                      return (
                        <span
                          key={id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border max-w-[200px] ${colorMap[info.color] || colorMap.slate}`}
                          title={info.name}
                        >
                          <span className="opacity-60 uppercase shrink-0" style={{ fontSize: "8px" }}>{info.label}</span>
                          <span className="truncate">{info.name}</span>
                          <button
                            onClick={() => removeSelectedId(id)}
                            className="ml-0.5 shrink-0 hover:opacity-70 transition-opacity"
                            title={`Remove ${info.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assignment Scope */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Who can access the selected content?
                </label>
                <div className="flex space-x-6 py-1">
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentScope"
                      value="ALL"
                      checked={assignmentScope === "ALL"}
                      onChange={() => setAssignmentScope("ALL")}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>All Students (Global)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentScope"
                      value="SPECIFIC"
                      checked={assignmentScope === "SPECIFIC"}
                      onChange={() => setAssignmentScope("SPECIFIC")}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Selected Branches Only</span>
                  </label>
                </div>
              </div>

              {assignmentScope === "ALL" ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Check className="w-12 h-12 text-emerald-500 bg-emerald-500/10 rounded-full p-2 mb-4" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Access open to all students
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Because "All Students" is selected, the selected target modules/companies will be globally visible and accessible by every student in the platform.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {branches.map((b) => {
                    const isChecked = selectedBranchIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        onClick={() => toggleBranchSelection(b.id)}
                        className={`text-left p-4 rounded-xl border font-bold transition-all flex items-center justify-between hover:scale-[1.01] ${
                          isChecked
                            ? "bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div>
                          <div className="text-sm">{b.name}</div>
                          <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mt-1">
                            {b.code}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                  {branches.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                      Please configure branches first in the "Manage Branches" tab.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold">
                {selectedEntityIds.length > 0 ? (
                  `Applying to ${selectedEntityIds.length} chosen target items.`
                ) : (
                  "Choose targets to proceed."
                )}
              </span>
              <button
                disabled={selectedEntityIds.length === 0 || loading}
                onClick={handleSaveBatchMappings}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span>{loading ? "Assigning..." : "Assign Access Permissions"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
