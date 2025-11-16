class SolutionConfigurator {
    constructor() {
        this.currentMode = 'zip'; // Track current mode: 'zip' or 'json'
        this.tabs = new Map(); // Store all tabs data
        this.activeTabId = null;
        this.tabCounter = 0;
        this.tabTypeListenersAdded = false; // Track if event listeners are added to tab type radio buttons
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mode tab switching
        document.getElementById('zipModeTab').addEventListener('click', () => this.switchMode('zip'));
        document.getElementById('jsonModeTab').addEventListener('click', () => this.switchMode('json'));
        
        // ZIP mode
        document.getElementById('browseBtn').addEventListener('click', this.selectSolutionFile.bind(this));
        document.getElementById('generateBtn').addEventListener('click', this.generateSettings.bind(this));
        
        // JSON mode
        document.getElementById('browseJsonBtn').addEventListener('click', this.selectJsonFile.bind(this));
        document.getElementById('loadJsonBtn').addEventListener('click', this.loadJsonSettings.bind(this));
        
        // Tab management
        document.getElementById('addTabBtn').addEventListener('click', this.showAddTabModal.bind(this));
        document.getElementById('confirmAddTab').addEventListener('click', this.addNewTab.bind(this));
        document.getElementById('cancelAddTab').addEventListener('click', this.hideAddTabModal.bind(this));
        
        // Input method warning modal
        document.getElementById('confirmInputMethodSwitch').addEventListener('click', this.confirmInputMethodSwitch.bind(this));
        document.getElementById('cancelInputMethodSwitch').addEventListener('click', this.cancelInputMethodSwitch.bind(this));
        
        // Save functionality
        document.getElementById('saveBtn').addEventListener('click', this.saveCurrentTab.bind(this));
        document.getElementById('saveAllBtn').addEventListener('click', this.saveAllTabs.bind(this));
        document.getElementById('resetBtn').addEventListener('click', this.resetCurrentTab.bind(this));

        // Merge functionality
        document.getElementById('mergeBtn').addEventListener('click', this.mergeSettings.bind(this));
        document.getElementById('closeMergeResults').addEventListener('click', this.closeMergeResultsModal.bind(this));
    }

    switchMode(mode) {
        console.log('switchMode called with mode:', mode, 'current mode:', this.currentMode, 'tabs count:', this.tabs.size);
        
        // Check if switching to a different mode
        if (this.currentMode === mode) {
            console.log('Already in this mode, returning');
            return; // Already in this mode, no need to switch
        }
        
        // Check if there are existing tabs and show warning
        if (this.tabs.size > 0) {
            console.log('Tabs exist, showing warning modal');
            this.showInputMethodWarning(mode);
            return;
        }
        
        console.log('No tabs exist, proceeding with switch');
        // No tabs exist, proceed with switching
        this.performModeSwitch(mode);
    }
    
    performModeSwitch(mode) {
        this.currentMode = mode;
        
        // Update tab appearance
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${mode}ModeTab`).classList.add('active');
        
        // Update panel visibility
        document.querySelectorAll('.mode-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${mode}Mode`).classList.add('active');
        
        // Reset any existing data when switching modes
        this.resetForm();
    }

    resetForm() {
        // Clear file paths
        const solutionPath = document.getElementById('solutionPath');
        const jsonPath = document.getElementById('jsonPath');
        const settingsFileName = document.getElementById('settingsFileName');
        if (solutionPath) solutionPath.value = '';
        if (jsonPath) jsonPath.value = '';
        if (settingsFileName) settingsFileName.value = '';
        
        // Disable buttons
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('loadJsonBtn').disabled = true;
        
        // Hide step 2 and clear any outputs
        this.hideStep2();
        this.hideOutput();
        
        // Clear all tabs
        this.tabs.clear();
        this.activeTabId = null;
        this.tabCounter = 0;
        
        // Clear tab UI elements
        const tabsList = document.getElementById('settingsTabsList');
        const tabContent = document.getElementById('settingsTabContent');
        if (tabsList) tabsList.innerHTML = '';
        if (tabContent) tabContent.innerHTML = '';
    }

    async selectJsonFile() {
        try {
            const filePath = await window.electronAPI.selectJsonFile();
            if (filePath) {
                document.getElementById('jsonPath').value = filePath;
                document.getElementById('loadJsonBtn').disabled = false;
                this.hideStep2();
            }
        } catch (error) {
            this.showError('Failed to select JSON file: ' + error.message);
        }
    }

    async loadJsonSettings() {
        const jsonPath = document.getElementById('jsonPath').value;
        if (!jsonPath) {
            this.showError('Please select a JSON settings file first.');
            return;
        }

        const loadBtn = document.getElementById('loadJsonBtn');
        const originalText = loadBtn.textContent;
        loadBtn.textContent = 'Loading...';
        loadBtn.disabled = true;

        try {
            // Load the JSON settings file
            const settingsData = await window.electronAPI.readSettingsFile(jsonPath);
            
            if (settingsData) {
                this.showOutput(`Settings loaded successfully from: ${jsonPath}`, 'success');
                
                // Create tab with loaded settings
                const fileName = jsonPath.split('\\').pop().split('/').pop().replace('.json', '');
                this.createTab(fileName, jsonPath, settingsData);
                this.showStep2();
            } else {
                this.showError('Failed to load settings from JSON file.');
            }
        } catch (error) {
            this.showError(`Failed to load JSON settings: ${error.message}`);
        } finally {
            loadBtn.textContent = originalText;
            loadBtn.disabled = false;
        }
    }

    async selectSolutionFile() {
        try {
            const filePath = await window.electronAPI.selectSolutionFile();
            if (filePath) {
                document.getElementById('solutionPath').value = filePath;
                
                // Auto-populate the settings file name
                const fileName = filePath.split('\\').pop().split('/').pop();
                const baseName = fileName.replace('.zip', '');
                document.getElementById('settingsFileName').value = `${baseName}_Settings`;
                
                document.getElementById('generateBtn').disabled = false;
                this.hideStep2();
            }
        } catch (error) {
            this.showError('Failed to select file: ' + error.message);
        }
    }

    async generateSettings() {
        const solutionPath = document.getElementById('solutionPath').value;
        const customFileName = document.getElementById('settingsFileName').value.trim();
        
        if (!solutionPath) {
            this.showError('Please select a solution file first.');
            return;
        }
        
        if (!customFileName) {
            this.showError('Please enter a settings file name.');
            return;
        }
        
        if (customFileName.includes(' ')) {
            this.showError('Settings file name cannot contain spaces.');
            return;
        }

        const generateBtn = document.getElementById('generateBtn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;

        try {
            const result = await window.electronAPI.runPacCommand(solutionPath, customFileName);
            
            if (result.success) {
                this.showOutput(`Settings file generated successfully: ${result.settingsFile}`, 'success');
                
                // Load the settings and create the first tab
                const settingsData = await window.electronAPI.readSettingsFile(result.settingsFile);
                if (settingsData) {
                    this.createTab(customFileName, result.settingsFile, settingsData);
                    this.showStep2();
                }
            }
        } catch (error) {
            this.showError(`Failed to generate settings: ${error.error || error.message}`);
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
    }

    // Tab Management Methods
    createTab(name, filePath, settingsData) {
        const tabId = `tab_${++this.tabCounter}`;
        const tabData = {
            id: tabId,
            name: name,
            filePath: filePath,
            settingsData: JSON.parse(JSON.stringify(settingsData)), // Deep copy
            connectionGroupStates: new Map(),
            hasUnsavedChanges: false
        };

        this.tabs.set(tabId, tabData);
        this.renderTab(tabId);
        this.switchToTab(tabId);
    }

    renderTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;

        // Create tab button
        const tabsList = document.getElementById('settingsTabsList');
        const tabButton = document.createElement('button');
        tabButton.className = 'settings-tab';
        tabButton.id = `tab-btn-${tabId}`;
        tabButton.innerHTML = `
            <span class="tab-name">${tabData.name}</span>
            <button class="tab-close" onclick="configurator.closeTab('${tabId}')">&times;</button>
        `;
        tabButton.addEventListener('click', () => this.switchToTab(tabId));
        tabsList.appendChild(tabButton);

        // Create tab content
        const tabContent = document.getElementById('settingsTabContent');
        const tabPanel = document.createElement('div');
        tabPanel.className = 'tab-panel';
        tabPanel.id = `tab-panel-${tabId}`;
        tabPanel.innerHTML = `
            <!-- Environment Variables -->
            <div class="settings-section">
                <h3>🌍 Environment Variables</h3>
                <div id="environmentVariables-${tabId}" class="variables-container">
                    <!-- Environment variables will be populated here -->
                </div>
            </div>

            <!-- Connection References -->
            <div class="settings-section">
                <h3>🔗 Connection References</h3>
                <div id="connectionReferences-${tabId}" class="variables-container">
                    <!-- Connection references will be populated here -->
                </div>
            </div>
        `;
        tabContent.appendChild(tabPanel);

        // Render the settings for this tab
        this.renderTabSettings(tabId);
    }

    renderTabSettings(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;

        this.renderEnvironmentVariables(tabId);
        this.renderConnectionReferences(tabId);
    }

    switchToTab(tabId) {
        // Update active tab
        this.activeTabId = tabId;

        // Update tab button styles
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab-btn-${tabId}`).classList.add('active');

        // Update tab panel visibility
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`tab-panel-${tabId}`).classList.add('active');
    }

    closeTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;

        // Check for unsaved changes
        if (tabData.hasUnsavedChanges) {
            if (!confirm(`Tab "${tabData.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }

        // Remove tab elements
        document.getElementById(`tab-btn-${tabId}`).remove();
        document.getElementById(`tab-panel-${tabId}`).remove();

        // Remove from tabs map
        this.tabs.delete(tabId);

        // Switch to another tab if this was active
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            } else {
                this.hideStep2();
            }
        }
    }

    showAddTabModal() {
        if (this.tabs.size === 0) {
            this.showError('Please create at least one tab first.');
            return;
        }

        const modal = document.getElementById('addTabModal');
        modal.classList.add('active');
        
        // Pre-populate tab name with current tab's name + '_Copy' for copy option
        const currentTab = this.tabs.get(this.activeTabId);
        const suggestedName = currentTab ? `${currentTab.name}_Copy` : 'New_Tab';
        document.getElementById('newTabName').value = suggestedName;
        
        // Ensure copy option is selected by default
        document.querySelector('input[name="addTabType"][value="copy"]').checked = true;
        
        // Show/hide tab name input based on selected option
        this.updateTabNameInputVisibility();
        
        // Add event listeners for radio buttons if not already added
        if (!this.tabTypeListenersAdded) {
            document.querySelectorAll('input[name="addTabType"]').forEach(radio => {
                radio.addEventListener('change', () => this.updateTabNameInputVisibility());
            });
            this.tabTypeListenersAdded = true;
        }
    }

    hideAddTabModal() {
        document.getElementById('addTabModal').classList.remove('active');
    }
    
    showInputMethodWarning(targetMode) {
        console.log('showInputMethodWarning called with targetMode:', targetMode);
        const modal = document.getElementById('inputMethodWarningModal');
        const tabCountSpan = document.getElementById('tabCount');
        
        console.log('Modal element:', modal);
        console.log('Tab count span:', tabCountSpan);
        
        // Store the target mode for later use
        this.pendingModeSwitch = targetMode;
        
        // Update the tab count in the warning message
        tabCountSpan.textContent = this.tabs.size;
        
        // Show the modal
        modal.classList.add('active');
        console.log('Modal classes after adding active:', modal.classList);
    }
    
    hideInputMethodWarning() {
        const modal = document.getElementById('inputMethodWarningModal');
        modal.classList.remove('active');
        this.pendingModeSwitch = null;
    }
    
    confirmInputMethodSwitch() {
        if (this.pendingModeSwitch) {
            this.performModeSwitch(this.pendingModeSwitch);
        }
        this.hideInputMethodWarning();
    }
    
    cancelInputMethodSwitch() {
        // Reset the tab appearance to the current mode
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${this.currentMode}ModeTab`).classList.add('active');
        
        this.hideInputMethodWarning();
    }

    updateTabNameInputVisibility() {
        const selectedOption = document.querySelector('input[name="addTabType"]:checked').value;
        const tabNameSection = document.querySelector('.add-tab-naming');
        const tabNameInput = document.getElementById('newTabName');
        
        if (selectedOption === 'load') {
            // Hide tab name input for JSON loading
            tabNameSection.style.display = 'none';
            tabNameInput.required = false;
        } else {
            // Show tab name input for copying
            tabNameSection.style.display = 'block';
            tabNameInput.required = true;
            
            // Update suggested name when switching back to copy
            const currentTab = this.tabs.get(this.activeTabId);
            const suggestedName = currentTab ? `${currentTab.name}_Copy` : 'New_Tab';
            tabNameInput.value = suggestedName;
        }
    }

    isTabNameTaken(tabName) {
        return Array.from(this.tabs.values()).some(tab => tab.name === tabName);
    }

    isFileAlreadyOpen(filePath) {
        return Array.from(this.tabs.values()).some(tab => tab.filePath === filePath);
    }

    async addNewTab() {
        const tabType = document.querySelector('input[name="addTabType"]:checked').value;
        
        if (tabType === 'copy') {
            const tabName = document.getElementById('newTabName').value.trim();

            if (!tabName) {
                this.showError('Please enter a tab name.');
                return;
            }

            // Check for duplicate tab names
            if (this.isTabNameTaken(tabName)) {
                this.showError(`Tab name "${tabName}" already exists. Please choose a different name.`);
                return;
            }

            this.hideAddTabModal();

            try {
                await this.copyCurrentTab(tabName);
            } catch (error) {
                this.showError(`Failed to create tab: ${error.message}`);
            }
        } else if (tabType === 'load') {
            this.hideAddTabModal();

            try {
                await this.loadExistingJsonForTab();
            } catch (error) {
                this.showError(`Failed to create tab: ${error.message}`);
            }
        }
    }

    async copyCurrentTab(newTabName) {
        if (!this.activeTabId) return;

        const currentTab = this.tabs.get(this.activeTabId);
        if (!currentTab) return;

        // Create a copy of the current tab's settings
        const copiedSettings = JSON.parse(JSON.stringify(currentTab.settingsData));

        // Generate a new file path for the copy
        const originalPath = currentTab.filePath;
        const dir = originalPath.substring(0, originalPath.lastIndexOf('\\'));
        const newFilePath = `${dir}\\${newTabName}.json`;

        // Save the copied settings to a new file
        await window.electronAPI.saveSettingsFile(newFilePath, copiedSettings);

        // Create the new tab
        this.createTab(newTabName, newFilePath, copiedSettings);
        this.showOutput(`Tab "${newTabName}" created as copy of "${currentTab.name}"`, 'success');
    }

    async loadExistingJsonForTab() {
        const filePath = await window.electronAPI.selectJsonFile();
        if (!filePath) return;

        // Check if this file is already open in another tab
        if (this.isFileAlreadyOpen(filePath)) {
            this.showError('This JSON file is already open in another tab. Please choose a different file.');
            return;
        }

        const settingsData = await window.electronAPI.readSettingsFile(filePath);
        if (!settingsData) {
            this.showError('Failed to load settings from selected file.');
            return;
        }

        // Extract file name (without extension) to use as tab name
        const fileName = filePath.split('\\').pop().split('/').pop().replace('.json', '');
        
        this.createTab(fileName, filePath, settingsData);
        this.showOutput(`Tab "${fileName}" loaded from ${filePath}`, 'success');
    }

    // This method is no longer needed - functionality moved to createTab method
    // async loadSettingsFile() - REMOVED
    // renderSettingsUI() - REMOVED

    isPowerBIVariable(envVar) {
        if (!envVar.DefaultValue) return false;
        
        try {
            const defaultValue = JSON.parse(envVar.DefaultValue);
            return defaultValue.group && defaultValue.component && 
                   defaultValue.group.id && defaultValue.group.name &&
                   defaultValue.component.id && defaultValue.component.name &&
                   (defaultValue.component.type === 'Dashboard' || defaultValue.component.type === 'Report');
        } catch {
            return false;
        }
    }

    parsePowerBIValue(value, defaultValue = null) {
        try {
            return JSON.parse(value);
        } catch {
            // If parsing fails, try to use the defaultValue as fallback
            if (defaultValue) {
                try {
                    return JSON.parse(defaultValue);
                } catch {
                    // If defaultValue also fails to parse, return basic structure
                    return {
                        group: { id: '', name: '' },
                        component: { id: '', name: '', type: 'Dashboard', embedUrl: 'https://app.powerbi.com/dashboardEmbed' }
                    };
                }
            }
            return {
                group: { id: '', name: '' },
                component: { id: '', name: '', type: 'Dashboard', embedUrl: 'https://app.powerbi.com/dashboardEmbed' }
            };
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderEnvironmentVariables(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        const container = document.getElementById(`environmentVariables-${tabId}`);
        container.innerHTML = '';

        if (tabData.settingsData.EnvironmentVariables && tabData.settingsData.EnvironmentVariables.length > 0) {
            tabData.settingsData.EnvironmentVariables.forEach((envVar, index) => {
                const varElement = this.isPowerBIVariable(envVar) 
                    ? this.createPowerBIVariableElement(envVar, index, tabId)
                    : this.createStandardVariableElement(envVar, index, tabId);
                container.appendChild(varElement);
            });
        } else {
            container.innerHTML = '<p class="no-items">No environment variables found in this solution.</p>';
        }
    }

    createStandardVariableElement(envVar, index, tabId) {
        const div = document.createElement('div');
        div.className = 'variable-item standard-variable';
        
        const defaultValueDisplay = envVar.DefaultValue 
            ? `<p class="default-value">Default Value: ${envVar.DefaultValue}</p>` 
            : '';

        div.innerHTML = `
            <div class="variable-header">
                <h4>${envVar.SchemaName}</h4>
                <span class="variable-type">${envVar.Type || 'String'}</span>
            </div>
            <div class="variable-body">
                <label for="env_${tabId}_${index}">Value:</label>
                <input type="text" id="env_${tabId}_${index}" data-index="${index}" data-type="environment" data-tab="${tabId}"
                       value="${envVar.Value || ''}" placeholder="Enter environment variable value">
                ${defaultValueDisplay}
                ${envVar.Description ? `<p class="description">${envVar.Description}</p>` : ''}
            </div>
        `;

        // Add event listener for input changes
        setTimeout(() => {
            const input = div.querySelector(`#env_${tabId}_${index}`);
            if (input) {
                input.addEventListener('input', () => this.markTabAsChanged(tabId));
            }
        }, 0);

        return div;
    }

    createPowerBIVariableElement(envVar, index, tabId) {
        const div = document.createElement('div');
        div.className = 'variable-item powerbi-variable';
        
        const defaultPBI = this.parsePowerBIValue(envVar.DefaultValue);
        const currentPBI = envVar.Value ? this.parsePowerBIValue(envVar.Value, envVar.DefaultValue) : { ...defaultPBI };

        div.innerHTML = `
            <div class="variable-header">
                <h4>${envVar.SchemaName}</h4>
                <span class="variable-type powerbi">Power BI Dashboard</span>
            </div>
            <div class="powerbi-container">
                <div class="powerbi-column">
                    <h5>📊 Default Configuration (Read-only)</h5>
                    <div class="powerbi-readonly">
                        <div class="powerbi-field">
                            <label>Group ID:</label>
                            <input type="text" readonly value="${defaultPBI.group?.id || ''}">
                        </div>
                        <div class="powerbi-field">
                            <label>Workspace Name:</label>
                            <input type="text" readonly value="${defaultPBI.group?.name || ''}">
                        </div>
                        <div class="powerbi-field">
                            <label>Component ID:</label>
                            <input type="text" readonly value="${defaultPBI.component?.id || ''}">
                        </div>
                        <div class="powerbi-field">
                            <label>Dashboard Name:</label>
                            <input type="text" readonly value="${defaultPBI.component?.name || ''}">
                        </div>
                        <div class="powerbi-field">
                            <label>Type:</label>
                            <input type="text" readonly value="${defaultPBI.component?.type || 'Dashboard'}">
                        </div>
                        <div class="powerbi-field">
                            <label>Embed URL:</label>
                            <input type="text" readonly value="${defaultPBI.component?.embedUrl || ''}">
                        </div>
                    </div>
                </div>
                <div class="powerbi-column">
                    <h5>✏️ Your Configuration</h5>
                    <div class="powerbi-editable">
                        <div class="powerbi-field">
                            <label for="pbi_group_id_${tabId}_${index}">Group ID:</label>
                            <input type="text" id="pbi_group_id_${tabId}_${index}" data-field="group.id" 
                                   value="${currentPBI.group?.id || ''}" placeholder="Enter Group ID">
                        </div>
                        <div class="powerbi-field">
                            <label for="pbi_workspace_${tabId}_${index}">Workspace Name:</label>
                            <input type="text" id="pbi_workspace_${tabId}_${index}" data-field="group.name" 
                                   value="${currentPBI.group?.name || ''}" placeholder="Enter Workspace Name">
                        </div>
                        <div class="powerbi-field">
                            <label for="pbi_component_id_${tabId}_${index}">Component ID:</label>
                            <input type="text" id="pbi_component_id_${tabId}_${index}" data-field="component.id" 
                                   value="${currentPBI.component?.id || ''}" placeholder="Enter Component ID">
                        </div>
                        <div class="powerbi-field">
                            <label for="pbi_dashboard_${tabId}_${index}">Dashboard Name:</label>
                            <input type="text" id="pbi_dashboard_${tabId}_${index}" data-field="component.name" 
                                   value="${currentPBI.component?.name || ''}" placeholder="Enter Dashboard Name">
                        </div>
                        <div class="powerbi-field">
                            <label for="pbi_type_${tabId}_${index}">Type:</label>
                            <input type="text" id="pbi_type_${tabId}_${index}" data-field="component.type" 
                                   value="${currentPBI.component?.type || defaultPBI.component?.type || 'Dashboard'}" readonly>
                        </div>
                        <div class="powerbi-field">
                            <label for="pbi_embed_${tabId}_${index}">Embed URL:</label>
                            <input type="text" id="pbi_embed_${tabId}_${index}" data-field="component.embedUrl" 
                                   value="${currentPBI.component?.embedUrl || defaultPBI.component?.embedUrl || 'https://app.powerbi.com/dashboardEmbed'}" readonly>
                        </div>
                    </div>
                </div>
            </div>
            <input type="hidden" id="env_${tabId}_${index}" data-index="${index}" data-type="powerbi" data-tab="${tabId}" value="${this.escapeHtml(JSON.stringify(currentPBI))}">
            ${envVar.Description ? `<p class="description">${envVar.Description}</p>` : ''}
        `;

        // Add event listeners for PowerBI fields
        setTimeout(() => {
            const fields = div.querySelectorAll('.powerbi-editable input:not([readonly])');
            fields.forEach(field => {
                field.addEventListener('input', () => {
                    this.updatePowerBIValue(tabId, index);
                    this.markTabAsChanged(tabId);
                });
            });
            // Initialize the hidden input value to ensure it's in sync
            this.updatePowerBIValue(tabId, index);
        }, 0);

        return div;
    }

    updatePowerBIValue(tabId, index) {
        const groupId = document.getElementById(`pbi_group_id_${tabId}_${index}`).value;
        const workspaceName = document.getElementById(`pbi_workspace_${tabId}_${index}`).value;
        const componentId = document.getElementById(`pbi_component_id_${tabId}_${index}`).value;
        const dashboardName = document.getElementById(`pbi_dashboard_${tabId}_${index}`).value;
        const type = document.getElementById(`pbi_type_${tabId}_${index}`).value;
        const embedUrl = document.getElementById(`pbi_embed_${tabId}_${index}`).value;

        const powerBIValue = {
            group: {
                id: groupId,
                name: workspaceName
            },
            component: {
                id: componentId,
                name: dashboardName,
                type: type,
                embedUrl: embedUrl
            }
        };

        document.getElementById(`env_${tabId}_${index}`).value = JSON.stringify(powerBIValue);
    }

    groupConnectionsByConnector(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return new Map();
        
        const groups = new Map();
        
        if (tabData.settingsData.ConnectionReferences) {
            tabData.settingsData.ConnectionReferences.forEach((connRef, index) => {
                const connectorId = connRef.ConnectorId || 'Unknown';
                if (!groups.has(connectorId)) {
                    groups.set(connectorId, []);
                }
                groups.get(connectorId).push({ ...connRef, originalIndex: index });
            });
        }
        
        return groups;
    }

    renderConnectionReferences(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        const container = document.getElementById(`connectionReferences-${tabId}`);
        container.innerHTML = '';

        const connectionGroups = this.groupConnectionsByConnector(tabId);

        if (connectionGroups.size > 0) {
            connectionGroups.forEach((connections, connectorId) => {
                const groupElement = this.createConnectionGroupElement(connectorId, connections, tabId);
                container.appendChild(groupElement);
            });
        } else {
            container.innerHTML = '<p class="no-items">No connection references found in this solution.</p>';
        }
    }

    updateConnectionGroup(connectorId, connections, tabId) {
        // Find the existing group element for this connector
        const container = document.getElementById(`connectionReferences-${tabId}`);
        const existingGroups = container.querySelectorAll('.connection-group');
        
        // Find the group with this connector's toggle
        let targetGroup = null;
        for (const group of existingGroups) {
            const toggle = group.querySelector(`#toggle_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (toggle) {
                targetGroup = group;
                break;
            }
        }
        
        if (targetGroup) {
            // Replace only this group
            const newGroupElement = this.createConnectionGroupElement(connectorId, connections, tabId);
            targetGroup.parentNode.replaceChild(newGroupElement, targetGroup);
        }
    }

    createConnectionGroupElement(connectorId, connections, tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return document.createElement('div');
        
        const div = document.createElement('div');
        div.className = 'connection-group';
        
        const isGroupMode = tabData.connectionGroupStates.get(connectorId) === 'group';
        const groupConnectionId = isGroupMode ? this.getGroupConnectionId(connections) : '';

        div.innerHTML = `
            <div class="connection-group-header">
                <h4>🔌 ${connectorId}</h4>
                <div class="connection-mode-toggle">
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}" 
                               ${isGroupMode ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">${isGroupMode ? 'Group Mode' : 'Individual Mode'}</span>
                    </label>
                </div>
            </div>
            <div class="connection-group-body">
                ${isGroupMode ? this.renderGroupModeConnections(connectorId, connections, groupConnectionId, tabId) 
                              : this.renderIndividualModeConnections(connectorId, connections, tabId)}
            </div>
        `;

        // Add toggle event listener
        setTimeout(() => {
            const toggle = div.querySelector(`#toggle_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}`);
            toggle.addEventListener('change', (e) => {
                this.toggleConnectionMode(connectorId, connections, e.target.checked, tabId);
            });
        }, 0);

        return div;
    }

    renderGroupModeConnections(connectorId, connections, groupConnectionId, tabId) {
        const html = `
            <div class="group-mode-container">
                <div class="group-connection-field">
                    <label for="group_conn_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}">Connection ID for all ${connections.length} connections:</label>
                    <input type="text" id="group_conn_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}" 
                           value="${groupConnectionId}" placeholder="Enter Connection ID for entire group"
                           data-connector="${connectorId}" data-mode="group" data-tab="${tabId}">
                </div>
                <div class="connection-list">
                    ${connections.map(conn => `
                        <div class="connection-item-readonly">
                            <span class="connection-name">${conn.LogicalName}</span>
                            <span class="connection-status">Will use group Connection ID</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listener for group connection input
        setTimeout(() => {
            const input = document.getElementById(`group_conn_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (input) {
                input.addEventListener('input', () => this.markTabAsChanged(tabId));
            }
        }, 0);

        return html;
    }

    renderIndividualModeConnections(connectorId, connections, tabId) {
        const html = `
            <div class="individual-mode-container">
                ${connections.map(conn => `
                    <div class="connection-item">
                        <div class="connection-header">
                            <h5>${conn.LogicalName}</h5>
                        </div>
                        <div class="connection-body">
                            <label for="conn_${tabId}_${conn.originalIndex}">Connection ID:</label>
                            <input type="text" id="conn_${tabId}_${conn.originalIndex}" 
                                   data-index="${conn.originalIndex}" data-type="connection" data-tab="${tabId}"
                                   value="${conn.ConnectionId || ''}" placeholder="Enter connection ID">
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners for connection inputs
        setTimeout(() => {
            connections.forEach(conn => {
                const input = document.getElementById(`conn_${tabId}_${conn.originalIndex}`);
                if (input) {
                    input.addEventListener('input', () => this.markTabAsChanged(tabId));
                }
            });
        }, 0);

        return html;
    }

    getGroupConnectionId(connections) {
        const connectionIds = connections.map(conn => conn.ConnectionId || '').filter(id => id);
        return connectionIds.length > 0 ? connectionIds[0] : '';
    }

    async toggleConnectionMode(connectorId, connections, isGroupMode, tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        if (isGroupMode) {
            // Switching to group mode
            const connectionIds = connections.map(conn => conn.ConnectionId || '').filter(id => id);
            const uniqueIds = [...new Set(connectionIds)];

            let selectedConnectionId = '';

            if (uniqueIds.length > 1) {
                // Show conflict resolution dialog
                selectedConnectionId = await this.showConnectionConflictDialog(uniqueIds, connectorId);
                if (!selectedConnectionId) {
                    // User cancelled, revert toggle
                    document.getElementById(`toggle_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}`).checked = false;
                    return;
                }
            } else if (uniqueIds.length === 1) {
                selectedConnectionId = uniqueIds[0];
            }

            tabData.connectionGroupStates.set(connectorId, 'group');
            
            // Update all connections in this group
            connections.forEach(conn => {
                conn.ConnectionId = selectedConnectionId;
            });
        } else {
            // Switching to individual mode
            tabData.connectionGroupStates.set(connectorId, 'individual');
        }

        // Re-render only this specific group
        this.updateConnectionGroup(connectorId, connections, tabId);
    }

    showConnectionConflictDialog(connectionIds, connectorId) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>🔄 Connection ID Conflict</h3>
                    <p>Multiple different Connection IDs found for connector <strong>${connectorId}</strong>.</p>
                    <p>Please select which Connection ID should be used for all connections in this group:</p>
                    <div class="radio-group">
                        ${connectionIds.map((id, index) => `
                            <label class="radio-option">
                                <input type="radio" name="connectionId" value="${id}" ${index === 0 ? 'checked' : ''}>
                                <span>${id}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="confirmSelection">Apply Selection</button>
                        <button class="btn btn-secondary" id="cancelSelection">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('#confirmSelection');
            const cancelBtn = modal.querySelector('#cancelSelection');

            confirmBtn.addEventListener('click', () => {
                const selected = modal.querySelector('input[name="connectionId"]:checked');
                document.body.removeChild(modal);
                resolve(selected ? selected.value : '');
            });

            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
        });
    }

    // OLD METHODS REMOVED - Now using saveCurrentTab and saveAllTabs
    // async saveSettings() - REMOVED
    // resetSettings() - REMOVED (Now using resetCurrentTab)

    showStep2() {
        document.getElementById('step2').classList.remove('hidden');
    }

    hideStep2() {
        document.getElementById('step2').classList.add('hidden');
    }

    hideOutput() {
        const output = document.getElementById('commandOutput');
        output.classList.add('hidden');
        const status = document.getElementById('saveStatus');
        status.classList.add('hidden');
    }

    showOutput(message, type = 'info') {
        const output = document.getElementById('commandOutput');
        output.textContent = message;
        output.className = `output ${type}`;
        output.classList.remove('hidden');
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('saveStatus');
        status.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
        
        setTimeout(() => {
            status.classList.add('hidden');
        }, 3000);
    }

    // Save functionality for tabs
    async saveCurrentTab() {
        if (!this.activeTabId) {
            this.showError('No active tab to save.');
            return;
        }
        
        const tabData = this.tabs.get(this.activeTabId);
        if (!tabData) return;
        
        try {
            // Update the tab's settings data with current form values
            this.updateTabSettingsFromForm(this.activeTabId);
            
            // Save to file
            await window.electronAPI.saveSettingsFile(tabData.filePath, tabData.settingsData);
            
            // Mark as saved
            tabData.hasUnsavedChanges = false;
            this.updateTabTitle(this.activeTabId);
            
            this.showStatus(`Tab \"${tabData.name}\" saved successfully!`, 'success');
        } catch (error) {
            this.showError(`Failed to save tab: ${error.message}`);
        }
    }
    
    async saveAllTabs() {
        if (this.tabs.size === 0) {
            this.showError('No tabs to save.');
            return;
        }
        
        let savedCount = 0;
        let errorCount = 0;
        
        for (const [tabId, tabData] of this.tabs) {
            try {
                // Update the tab's settings data with current form values
                this.updateTabSettingsFromForm(tabId);
                
                // Save to file
                await window.electronAPI.saveSettingsFile(tabData.filePath, tabData.settingsData);
                
                // Mark as saved
                tabData.hasUnsavedChanges = false;
                this.updateTabTitle(tabId);
                
                savedCount++;
            } catch (error) {
                errorCount++;
                console.error(`Failed to save tab ${tabData.name}:`, error);
            }
        }
        
        if (errorCount === 0) {
            this.showStatus(`All ${savedCount} tabs saved successfully!`, 'success');
        } else {
            this.showStatus(`${savedCount} tabs saved, ${errorCount} failed`, 'error');
        }
    }
    
    resetCurrentTab() {
        if (!this.activeTabId) {
            this.showError('No active tab to reset.');
            return;
        }

        if (confirm('Are you sure you want to reset all changes in the current tab?')) {
            this.renderTabSettings(this.activeTabId);
            const tabData = this.tabs.get(this.activeTabId);
            if (tabData) {
                tabData.hasUnsavedChanges = false;
                this.updateTabTitle(this.activeTabId);
            }
        }
    }

    async mergeSettings() {
        if (!this.activeTabId) {
            this.showError('No active tab to merge into.');
            return;
        }

        try {
            const mergeFilePath = await window.electronAPI.openFileDialog({
                title: 'Select JSON file to merge from',
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
            });

            if (!mergeFilePath) return; // User cancelled

            const mergeData = await window.electronAPI.readSettingsFile(mergeFilePath);
            if (!mergeData) {
                this.showError('Failed to read merge file.');
                return;
            }

            // Perform the merge
            const results = this.performMerge(this.activeTabId, mergeData);

            // Re-render the tab to show merged values
            this.renderTabSettings(this.activeTabId);

            // Mark tab as changed
            this.markTabAsChanged(this.activeTabId);

            // Show merge results
            this.showMergeResults(results);

        } catch (error) {
            this.showError(`Failed to merge settings: ${error.message}`);
        }
    }

    performMerge(tabId, mergeData) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return null;

        const results = {
            envVarsMatched: 0,
            envVarsTotal: 0,
            connRefsMatched: 0,
            connRefsTotal: 0,
            matchedEnvVars: [],
            matchedConnRefs: []
        };

        // Merge Environment Variables
        if (tabData.settingsData.EnvironmentVariables && mergeData.EnvironmentVariables) {
            results.envVarsTotal = tabData.settingsData.EnvironmentVariables.length;

            tabData.settingsData.EnvironmentVariables.forEach(envVar => {
                const match = mergeData.EnvironmentVariables.find(
                    mergeVar => mergeVar.SchemaName === envVar.SchemaName
                );

                if (match && match.Value) {
                    envVar.Value = match.Value;
                    results.envVarsMatched++;
                    results.matchedEnvVars.push(envVar.SchemaName);
                }
            });
        }

        // Merge Connection References
        if (tabData.settingsData.ConnectionReferences && mergeData.ConnectionReferences) {
            results.connRefsTotal = tabData.settingsData.ConnectionReferences.length;

            tabData.settingsData.ConnectionReferences.forEach(connRef => {
                const match = mergeData.ConnectionReferences.find(
                    mergeRef => mergeRef.LogicalName === connRef.LogicalName
                );

                if (match && match.ConnectionId) {
                    connRef.ConnectionId = match.ConnectionId;
                    results.connRefsMatched++;
                    results.matchedConnRefs.push(connRef.LogicalName);
                }
            });
        }

        return results;
    }

    showMergeResults(results) {
        const modal = document.getElementById('mergeResultsModal');
        const content = document.getElementById('mergeResultsContent');

        const envVarsUnmatched = results.envVarsTotal - results.envVarsMatched;
        const connRefsUnmatched = results.connRefsTotal - results.connRefsMatched;

        content.innerHTML = `
            <div class="merge-results">
                <h4>Environment Variables</h4>
                <p>✅ Matched and merged: <strong>${results.envVarsMatched}</strong> of ${results.envVarsTotal}</p>
                ${envVarsUnmatched > 0 ? `<p>⚠️ Not matched (left blank): <strong>${envVarsUnmatched}</strong></p>` : ''}
                ${results.matchedEnvVars.length > 0 ? `
                    <details>
                        <summary>Show matched variables</summary>
                        <ul>
                            ${results.matchedEnvVars.map(name => `<li>${name}</li>`).join('')}
                        </ul>
                    </details>
                ` : ''}

                <h4 style="margin-top: 20px;">Connection References</h4>
                <p>✅ Matched and merged: <strong>${results.connRefsMatched}</strong> of ${results.connRefsTotal}</p>
                ${connRefsUnmatched > 0 ? `<p>⚠️ Not matched (left blank): <strong>${connRefsUnmatched}</strong></p>` : ''}
                ${results.matchedConnRefs.length > 0 ? `
                    <details>
                        <summary>Show matched references</summary>
                        <ul>
                            ${results.matchedConnRefs.map(name => `<li>${name}</li>`).join('')}
                        </ul>
                    </details>
                ` : ''}
            </div>
        `;

        modal.style.display = 'flex';
    }

    closeMergeResultsModal() {
        const modal = document.getElementById('mergeResultsModal');
        modal.style.display = 'none';
    }

    markTabAsChanged(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        tabData.hasUnsavedChanges = true;
        this.updateTabTitle(tabId);
    }

    updateTabSettingsFromForm(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Update Environment Variables
        if (tabData.settingsData.EnvironmentVariables) {
            tabData.settingsData.EnvironmentVariables.forEach((envVar, index) => {
                const input = document.getElementById(`env_${tabId}_${index}`);
                if (input) {
                    if (input.dataset.type === 'powerbi') {
                        // For PowerBI variables, the value is already updated by updatePowerBIValue
                        envVar.Value = input.value;
                    } else {
                        // For standard environment variables
                        envVar.Value = input.value;
                    }
                }
            });
        }

        // Update Connection References
        if (tabData.settingsData.ConnectionReferences) {
            tabData.settingsData.ConnectionReferences.forEach((connRef, index) => {
                // Check if it's in group mode
                const connectorId = connRef.ConnectorId || 'Unknown';
                const isGroupMode = tabData.connectionGroupStates.get(connectorId) === 'group';
                
                if (isGroupMode) {
                    // Get the group connection ID
                    const groupInput = document.getElementById(`group_conn_${tabId}_${connectorId.replace(/[^a-zA-Z0-9]/g, '_')}`);
                    if (groupInput) {
                        connRef.ConnectionId = groupInput.value;
                    }
                } else {
                    // Get individual connection ID
                    const input = document.getElementById(`conn_${tabId}_${index}`);
                    if (input) {
                        connRef.ConnectionId = input.value;
                    }
                }
            });
        }
    }
    
    updateTabTitle(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        const tabButton = document.getElementById(`tab-btn-${tabId}`);
        if (tabButton) {
            const tabName = tabButton.querySelector('.tab-name');
            if (tabName) {
                tabName.textContent = tabData.hasUnsavedChanges ? `${tabData.name} *` : tabData.name;
            }
        }
    }

    showError(message) {
        this.showOutput(message, 'error');
        this.showStatus(message, 'error');
    }
}

// Global variable to access configurator
let configurator;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    configurator = new SolutionConfigurator();
});