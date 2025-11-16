# 🔧 Solution Settings Configurator

A powerful and intuitive desktop application for configuring environment variables and connection references for Power Platform Solution settings to facilitate ALM during DevOps processes. Built with Electron, this tool streamlines the process of managing solution configurations across different environments.

## 📋 Overview

The Solution Settings Configurator simplifies the management of Dataverse solution settings by providing an easy-to-use graphical interface for:

- **Environment Variables Configuration**: Manage both standard and Power BI dashboard variables
- **Connection References Management**: Configure connection IDs with support for individual and group modes
- **Multi-Environment Support**: Work with multiple configuration tabs simultaneously
- **Visual Configuration**: Side-by-side comparison of default and custom configurations
- **File Management**: Generate settings from solution ZIP files or load existing JSON configurations

## ✨ Features

### 🎯 Core Functionality
- **Dual Input Methods**: Generate settings from managed solution ZIP files or load existing JSON configurations
- **Power Platform CLI Integration**: Leverages the official Microsoft Power Platform CLI for settings generation
- **Multi-Tab Interface**: Work with multiple solution configurations simultaneously
- **Smart Connection Grouping**: Group connections by connector type with conflict resolution
- **Auto-Save Capabilities**: Save individual tabs or all configurations at once
- **Merge**: Use existing setting files and merge them with the most recent settings generated from your solution (Perfect for those cases where your solution contains new environment variables or connection references) 


### 🔌 Connection Reference Management
- **Individual Mode**: Configure each connection reference separately
- **Group Mode**: Apply the same connection ID to all references of the same connector type
- **Conflict Resolution**: Intelligent handling of conflicting connection IDs when switching modes
- **Visual Status Indicators**: Clear indication of configuration status for each connection

### 🌍 Environment Variables Support
- **Standard Variables**: Text-based environment variable configuration
- **Power BI Dashboard Variables**: Specialized interface for Power BI dashboard configurations
- **Default Value Display**: View original default values alongside custom configurations
- **JSON Structure Validation**: Proper handling of complex JSON-based variable values

### 💾 File Operations
- **JSON Export/Import**: Save and load configuration files in standard JSON format
- **Auto-naming**: Intelligent file naming based on solution names
- **Change Tracking**: Visual indicators for unsaved changes
- **Batch Operations**: Save all open configurations with a single action

## 🚀 Getting Started

### Prerequisites

1. **Power Platform CLI**: Install the [Microsoft Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/howto/install-cli-msi) on your system

The easiest way to begin is by downloading the **portable executable** from the project's release page.

### 🔽 Download the Portable App (Recommended)

1. Go to the **[Releases](https://github.com/ReggieAvalos/Solution-Settings-Configurator/releases)** section of this repository  
2. Download the latest `Solution.Settings.Configurator.1.0.0.zip` file containing the portable application
3. Extract the contents  
4. Launch **Solution Settings Configurator.exe**

No installation required — just download, extract, and run.

---
## 🛠️ Alternative: Build the Application Yourself

If you prefer to run the project from source or contribute to development, you can build it locally.

### Prerequisites

1. **Power Platform CLI**: Install the [Microsoft Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/howto/install-cli-msi) on your system
2. **Windows Operating System**: This application is designed for Windows environments
3. **Node.js**: Required for development (if building from source)

### Build & Run from Source

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/Solution-Settings-Configurator.git
   cd Solution-Settings-Configurator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build-win
   ```

### Quick Start Guide

1. **Launch the Application**: Open Solution Settings Configurator
2. **Choose Input Method**:
   - **Generate from ZIP**: Select a managed solution ZIP file and generate settings using Power Platform CLI
   - **Load Existing JSON**: Import an existing settings JSON file
3. **Configure Settings**: Use the intuitive interface to set environment variables and connection references
4. **Save Configuration**: Save individual tabs or all configurations to JSON files
5. **Deploy**: Use the generated JSON files, and integrate the files on you ALM deployment process for Power Platform

## 🎮 Usage

### Working with Solution ZIP Files

1. Select the "Generate from ZIP" tab
2. Click "Browse ZIP" and select your managed solution file
3. Enter a custom name for the settings file
4. Click "Generate Settings" to create the configuration file using Power Platform CLI
5. Configure the generated settings in the visual interface

### Working with Existing JSON Files

1. Select the "Load Existing JSON" tab
2. Click "Browse JSON" and select your existing settings file
3. Click "Load Settings" to import the configuration
4. Make modifications using the visual interface

### Managing Multiple Configurations

- **Add Tabs**: Click the "+ Add Tab" button to create new configuration tabs
- **Copy Current Tab**: Duplicate an existing configuration to create variations
- **Load Additional JSON**: Import different configuration files into separate tabs
- **Switch Between Tabs**: Click on tab headers to switch between different configurations

### Connection Reference Modes

#### Individual Mode (Default)
- Each connection reference is configured separately
- Suitable when different connections need different IDs
- Provides granular control over each connection

#### Group Mode
- All connection references of the same connector type share the same connection ID
- Efficient for environments where connections of the same type use identical configurations
- Automatic conflict resolution when switching from individual to group mode

## 🛠️ Technical Details

### Built With
- **Electron**: Cross-platform desktop application framework
- **Node.js**: JavaScript runtime for backend operations
- **HTML/CSS/JavaScript**: Frontend user interface
- **Power Platform CLI**: Microsoft's official command-line tool for Power Platform operations

### Architecture
- **Main Process** (`main.js`): Electron main process handling file operations and CLI integration
- **Renderer Process** (`renderer.js`): User interface logic and state management
- **Preload Script** (`preload.js`): Secure communication bridge between main and renderer processes

### File Structure
```
Solution-Settings-Configurator/
├── main.js              # Electron main process
├── renderer.js          # Frontend application logic
├── preload.js           # Secure IPC bridge
├── index.html           # Application UI structure
├── styles.css           # Application styling
├── package.json         # Node.js configuration
├── icon.ico             # Application icon
```

### Security Features
- **Context Isolation**: Secure separation between main and renderer processes
- **Node Integration Disabled**: Enhanced security through isolated execution contexts
- **Preload Script**: Controlled API exposure for secure IPC communication

## 📝 Configuration File Format

The application generates and consumes JSON configuration files with the following structure:

```json
{
  "EnvironmentVariables": [
    {
      "SchemaName": "your_env_variable",
      "Value": "configured_value",
      "Type": "String",
      "DefaultValue": "default_value",
      "Description": "Variable description"
    }
  ],
  "ConnectionReferences": [
    {
      "LogicalName": "your_connection_ref",
      "ConnectionId": "connection_guid",
      "ConnectorId": "connector_id"
    }
  ]
}
```

## 🔧 Development

### Development Commands
```bash
npm start        # Run the application
npm run dev      # Run with developer tools enabled
npm run build    # Build for all platforms
npm run build-win    # Build for Windows
npm run build-mac    # Build for macOS
npm run build-linux  # Build for Linux
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Power Platform CLI Not Found**
- Ensure the Power Platform CLI is installed and available in your system PATH
- Restart the application after installing the CLI

**File Access Errors**
- Check that you have write permissions to the selected output directory
- Ensure the solution ZIP file is not corrupted or password-protected

**JSON Loading Errors**
- Verify that the JSON file follows the expected schema format
- Check for syntax errors in manually edited JSON files

### Error Messages
- **"Failed to generate settings"**: Usually indicates Power Platform CLI issues or invalid solution files
- **"Tab name already exists"**: Choose a unique name when creating new tabs
- **"This JSON file is already open"**: Each JSON file can only be open in one tab at a time

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Jose Regino Avalos Mancilla** - 🔗[Profile](https://www.linkedin.com/in/regino-avalos/)
Solution Architect and Microsoft Power Platform Expert with 9+ years of experience designing, building, and deploying enterprise-grade business applications.

My core areas of expertise include:

- **Power Pages / PowerApps Portals**: End-to-end implementation, advanced customization with HTML/JS/CSS Specialized in jQuery and Bootstrap v3 and v5 for responsive design and Accessibility best practices. Azure AD B2C, Entra External ID, OpenID and SAML authentication processes, building secure self-service experiences for external users.
- **PCF Control Development**: Creating custom Power Platform components to enhance model-driven apps with React framework. 
- **Power Platform & Dataverse Architecture**: Solution design, data modeling, security configuration, automation patterns, and performance-optimized implementations.
- **Dynamics 365 Extensions & Advanced Development**: Plug-ins, Custom Workflow Activities, Azure Functions, Web Jobs, and integration with enterprise services using C#, REST, and SOAP.
- **ALM & DevOps for Power Platform**: Designing CI/CD pipelines, automating solution deployments, managing environment variables and connection references, and implementing best practices for enterprise ALM.
- **Enterprise Integrations**: Power BI, Adobe Sign, Azure Storage, identity management, and custom API integrations.

I am passionate about building clean, robust, and maintainable architecture that accelerates delivery, improves reliability, and elevates the overall quality of Power Platform solutions.


## 🤝 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the [Power Platform CLI documentation](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
3. Create an issue in this repository with detailed information about your problem

---

*This tool is designed to complement the Microsoft Power Platform ecosystem and streamline solution deployment processes.*