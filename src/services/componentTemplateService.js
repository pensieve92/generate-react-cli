const chalk = require('chalk');
const replace = require('replace');
const { camelCase } = require('lodash');
const { existsSync, outputFileSync } = require('fs-extra');
const componentJsTemplate = require('../templates/component/componentJsTemplate');
const componentTsTemplate = require('../templates/component/componentTsTemplate');
const componentCssTemplate = require('../templates/component/componentCssTemplate');
const componentLazyTemplate = require('../templates/component/componentLazyTemplate');
const componentIndexTemplate = require('../templates/component/componentIndexTemplate');
const componentTsLazyTemplate = require('../templates/component/componentTsLazyTemplate');
const componentStoryTemplate = require('../templates/component/componentStoryTemplate');
const componentTestEnzymeTemplate = require('../templates/component/componentTestEnzymeTemplate');
const componentTestDefaultTemplate = require('../templates/component/componentTestDefaultTemplate');
const componentTestTestingLibraryTemplate = require('../templates/component/componentTestTestingLibraryTemplate');

// private

function getComponentScriptTemplate({ cmd, cliConfigFile, componentName, componentPathDir }) {
  const { component, usesTypeScript } = cliConfigFile;
  const fileExtension = usesTypeScript ? 'tsx' : 'js';
  let template = usesTypeScript ? componentTsTemplate : componentJsTemplate;

  // --- If test library is not Testing Library or if withTest is false. Remove data-testid from template

  if (component.test.library !== 'Testing Library' || !cmd.withTest) {
    template = template.replace(` data-testid="TemplateName"`, '');
  }

  // --- If it has a corresponding stylesheet

  if (cmd.withStyle) {
    const module = component.css.module ? '.module' : '';
    const cssPath = `${componentName}${module}.${component.css.preprocessor}`;

    // --- If the css module is true make sure to update the template accordingly

    if (module.length) {
      template = template.replace(`'./TemplateName.module.css'`, `'./${cssPath}'`);
    } else {
      template = template.replace(`{styles.TemplateName}`, `"${componentName}"`);
      template = template.replace(`styles from './TemplateName.module.css'`, `'./${cssPath}'`);
    }
  } else {
    // --- If no stylesheet, remove className attribute and style import from jsTemplate

    template = template.replace(`className={styles.TemplateName} `, '');
    template = template.replace(`import styles from './TemplateName.module.css';`, '');
  }

  return {
    template,
    templateType: `Component "${componentName}.${fileExtension}"`,
    componentPath: `${componentPathDir}/${componentName}.${fileExtension}`,
    componentName,
  };
}

function getComponentStyleTemplate({ cliConfigFile, componentName, componentPathDir }) {
  const { component } = cliConfigFile;
  const module = component.css.module ? '.module' : '';
  const cssPath = `${componentName}${module}.${component.css.preprocessor}`;

  return {
    template: componentCssTemplate,
    templateType: `Stylesheet "${cssPath}"`,
    componentPath: `${componentPathDir}/${cssPath}`,
    componentName,
  };
}

function getComponentTestTemplate({ cliConfigFile, componentName, componentPathDir }) {
  const { component, usesTypeScript } = cliConfigFile;
  const fileExtension = usesTypeScript ? 'tsx' : 'js';
  let template = null;

  // --- Get test template based on test library type

  if (component.test.library === 'Enzyme') {
    template = componentTestEnzymeTemplate;
  } else if (component.test.library === 'Testing Library') {
    template = componentTestTestingLibraryTemplate.replace(/#|templateName/g, camelCase(componentName));
  } else {
    template = componentTestDefaultTemplate;
  }

  return {
    template,
    templateType: `Test "${componentName}.test.${fileExtension}"`,
    componentPath: `${componentPathDir}/${componentName}.test.${fileExtension}`,
    componentName,
  };
}

function getComponentStoryTemplate({ cliConfigFile, componentName, componentPathDir }) {
  const { usesTypeScript } = cliConfigFile;
  const fileExtension = usesTypeScript ? 'tsx' : 'js';

  return {
    template: componentStoryTemplate,
    templateType: `Story "${componentName}.stories.${fileExtension}"`,
    componentPath: `${componentPathDir}/${componentName}.stories.${fileExtension}`,
    componentName,
  };
}

function getComponentLazyTemplate({ cliConfigFile, componentName, componentPathDir }) {
  const { usesTypeScript } = cliConfigFile;
  const fileExtension = usesTypeScript ? 'tsx' : 'js';

  return {
    template: usesTypeScript ? componentTsLazyTemplate : componentLazyTemplate,
    templateType: `Lazy "${componentName}.lazy.${fileExtension}"`,
    componentPath: `${componentPathDir}/${componentName}.lazy.${fileExtension}`,
    componentName,
  };
}

function getComponentIndexTemplate({ cliConfigFile, componentName, componentPathDir }) {
  const { usesTypeScript } = cliConfigFile;
  const fileExtension = usesTypeScript ? 'tsx' : 'js';

  return {
    template: componentIndexTemplate,
    templateType: `Index "index.${fileExtension}"`,
    componentPath: `${componentPathDir}/index.${fileExtension}`,
    componentName,
  };
}

// public

// --- Template Types

const componentTemplateTypes = {
  STYLE: 'withStyle',
  TEST: 'withTest',
  STORY: 'withStory',
  LAZY: 'withLazy',
  INDEX: 'withIndex',
  COMPONENT: 'component',
};

function generateComponentTemplates(componentTemplates) {
  for (let i = 0; i < componentTemplates.length; i += 1) {
    const { template, templateType, componentPath, componentName } = componentTemplates[i];

    // --- Make sure the component templateType does not already exist in the path directory.

    if (existsSync(componentPath)) {
      console.error(chalk.red(`${templateType} already exists in this path "${componentPath}".`));
    } else {
      try {
        outputFileSync(componentPath, template);

        const replaceDefaultOptions = {
          regex: 'TemplateName',
          replacement: componentName,
          paths: [componentPath],
          recursive: false,
          silent: true,
        };

        replace(replaceDefaultOptions);

        console.log(chalk.green(`${templateType} was created successfully at ${componentPath}`));
      } catch (error) {
        console.error(chalk.red(`${templateType} failed and was not created.`));
        console.error(error);
      }
    }
  }
}

function getComponentTemplate(cmd, cliConfigFile, componentName, templateType) {
  const componentPathDir = `${cmd.path}/${componentName}`;
  const templateMap = {
    [componentTemplateTypes.STYLE]: getComponentStyleTemplate,
    [componentTemplateTypes.TEST]: getComponentTestTemplate,
    [componentTemplateTypes.STORY]: getComponentStoryTemplate,
    [componentTemplateTypes.LAZY]: getComponentLazyTemplate,
    [componentTemplateTypes.INDEX]: getComponentIndexTemplate,
    [componentTemplateTypes.COMPONENT]: getComponentScriptTemplate,
  };

  if (templateMap[templateType]) {
    return templateMap[templateType]({ cmd, cliConfigFile, componentName, componentPathDir });
  }

  return null;
}

module.exports = {
  componentTemplateTypes,
  generateComponentTemplates,
  getComponentTemplate,
};
