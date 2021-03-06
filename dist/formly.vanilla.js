// Render module for formly to display forms
angular.module('formly.render', []);
// Main Formly Module
angular.module('formly', ['formly.render']);
angular.module('formly.render')
.provider('formlyConfig', function() {
	'use strict';

	var templateUrlMap = {};
	var templateMap = {};

	function setTemplateUrl(name, templateUrl) {
		if (typeof name === 'string') {
			templateUrlMap[name] = templateUrl;
		} else {
			angular.forEach(name, function(templateUrl, name) {
				setTemplateUrl(name, templateUrl);
			});
		}
	}

	function getTemplateUrl(type) {
		return templateUrlMap[type];
	}

	function setTemplate(name, template) {
		if (typeof name === 'string') {
			templateMap[name] = template;
		} else {
			angular.forEach(name, function(template, name) {
				setTemplate(name, template);
			});
		}
	}

	function getTemplate(type) {
		return templateMap[type];
	}

	this.getTemplateUrl = getTemplateUrl;
	this.setTemplateUrl = setTemplateUrl;

	this.getTemplate = getTemplate;
	this.setTemplate = setTemplate;

	this.$get = function formlyConfig() {
		return this;
	};
	
});
angular.module('formly.render')
.directive('formlyField', ["$http", "$compile", "$templateCache", "formlyConfig", function formlyField($http, $compile, $templateCache, formlyConfig) {
	'use strict';
	return {
		restrict: 'AE',
		transclude: true,
		scope: {
			optionsData: '&options',
			formId: '=formId',
			index: '=index',
			value: '=formValue',
			result: '=formResult'
		},
		link: function fieldLink($scope, $element, $attr) {
			var template = $scope.options.template || formlyConfig.getTemplate($scope.options.type);
			if (template) {
				setElementTemplate($templateCache.get(template));
			} else {
				var templateUrl = $scope.options.templateUrl || formlyConfig.getTemplateUrl($scope.options.type);
				if (templateUrl) {
					$http.get(templateUrl, {
						cache: $templateCache
					}).then(function(response) {
						setElementTemplate(response.data);
					}, function(error) {
						console.warn('Formly Error: Problem loading template for ' + templateUrl, error);
					});
				} else {
					console.warn('Formly Error: template type \'' + $scope.options.type + '\' not supported.');
				}
			}
			function setElementTemplate(templateData) {
				$element.html(templateData);
				$compile($element.contents())($scope);
			}
		},
		controller: ["$scope", function fieldController($scope) {
            $scope._ = _;

            $scope.options = $scope.optionsData();
			var type = $scope.options.type;
			if (!type && $scope.options.template) {
				type = 'template';
			} else if (!type && $scope.options.templateUrl) {
				type = 'templateUrl';
			}

			// set field id to link labels and fields
			$scope.id = $scope.formId + type + $scope.index;
		}]
	};
}]);

angular.module('formly.render')
.directive('formlyForm', function formlyForm() {
	'use strict';
	return {
		restrict: 'E',
		templateUrl: 'directives/formly-form.html',
		replace: true,
		transclude: true,
		scope: {
			fields: '=',
			options: '=?',
			result: '=',
			formOnParentScope: '=name'
		},
		compile: function () {
			return {
				post: function (scope, ele, attr, controller) {
					//Post gets called after angular has created the FormController
					//Now pass the FormController back up to the parent scope
					scope.formOnParentScope = scope[attr.name];
				}
			};
		},
		controller: ["$scope", "$element", "$parse", function($scope, $element, $parse) {
			// setup watches for watchExpressions
			angular.forEach($scope.fields, function(field, index) {
				if (angular.isDefined(field.watch) &&
					angular.isDefined(field.watch.expression) &&
					angular.isDefined(field.watch.listener)) {
					var watchExpression = field.watch.expression;
					if (angular.isFunction(watchExpression)) {
						// wrap the field's watch expression so we can call it with the field as the first arg as a helper
						watchExpression = function() {
							var args = Array.prototype.slice.call(arguments, 0);
							args.unshift(field);
							return field.watch.expression.apply(this, args);
						};
					}

					$scope.$watch(watchExpression, function() {
						// wrap the field's watch listener so we can call it with the field as the first arg as a helper
						var args = Array.prototype.slice.call(arguments, 0);
						args.unshift(field);
						return field.watch.listener.apply(this, args);
					});
				}
			});
			$scope.$watch('result', function(newValue) {
				angular.forEach($scope.fields, function(field, index) {
					if (field.hideExpression) {
						field.hide = $parse(field.hideExpression)($scope.result);
					}
					if (field.requiredExpression) {
						field.required = $parse(field.requiredExpression)($scope.result);
					}
				});
			}, true);
		}]
	};
});
angular.module('formly.render').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('fields/formly-field-checkbox.html',
    "<div><label><input type=checkbox aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value> {{options.label || 'Checkbox'}} {{options.required ? '*' : ''}}</label><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-email.html',
    "<div><label for={{id}}>{{options.label || 'Email'}} {{options.required ? '*' : ''}}</label><input type=email id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-hidden.html',
    "<input type=hidden ng-model=value>"
  );


  $templateCache.put('fields/formly-field-number.html',
    "<div><label for={{id}}>{{options.label || 'Number'}} {{options.required ? '*' : ''}}</label><input type=number id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled min={{options.min}} max={{options.max}} ng-minlength={{options.minlength}} ng-maxlength={{options.maxlength}} ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-password.html',
    "<div><label for={{id}}>{{options.label || 'Password'}} {{options.required ? '*' : ''}}</label><input type=password id={{id}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-trim=\"{{options.trimWhitespace || false}}\" ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-radio.html',
    "<div><label>{{options.label}} {{options.required ? '*' : ''}}</label><div ng-repeat=\"(key, option) in options.options\"><label><input type=radio name={{id}} id=\"{{id + '_'+ $index}}\" aria-describedby={{id}}_description ng-value=option.value ng-required=options.required ng-model=$parent.value> {{option.name}}</label><p id={{id}}_description ng-if=option.description>{{option.description}}</p></div></div>"
  );


  $templateCache.put('fields/formly-field-select.html',
    "<div><label for={{id}}>{{options.label || 'Select'}} {{options.required ? '*' : ''}}</label><select id={{id}} aria-describedby={{id}}_description ng-model=value ng-required=options.required ng-disabled=options.disabled ng-init=\"value = options.default\" ng-options=\"option.value as option.name group by option.group for option in options.options\"></select><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-text.html',
    "<div><label for={{id}}>{{options.label || 'Text'}} {{options.required ? '*' : ''}}</label><input type=text id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-textarea.html',
    "<div><label for={{id}}>{{options.label || 'Text'}} {{options.required ? '*' : ''}}</label><textarea type=text id={{id}} rows={{options.lines}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value>\n" +
    "\t</textarea><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );

}]);
angular.module('formly.render').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('directives/formly-form.html',
    "<form class=formly role=form><formly-field ng-repeat=\"field in fields\" options=field form-result=result form-value=result[field.key||$index] form-id=options.uniqueFormId ng-if=!field.hide index=$index></formly-field><div ng-transclude></div></form>"
  );

}]);
angular.module('formly.render').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('fields/formly-field-checkbox.html',
    "<div><label><input type=checkbox aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value> {{options.label || 'Checkbox'}} {{options.required ? '*' : ''}}</label><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-email.html',
    "<div><label for={{id}}>{{options.label || 'Email'}} {{options.required ? '*' : ''}}</label><input type=email id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-hidden.html',
    "<input type=hidden ng-model=value>"
  );


  $templateCache.put('fields/formly-field-number.html',
    "<div><label for={{id}}>{{options.label || 'Number'}} {{options.required ? '*' : ''}}</label><input type=number id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled min={{options.min}} max={{options.max}} ng-minlength={{options.minlength}} ng-maxlength={{options.maxlength}} ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-password.html',
    "<div><label for={{id}}>{{options.label || 'Password'}} {{options.required ? '*' : ''}}</label><input type=password id={{id}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-trim=\"{{options.trimWhitespace || false}}\" ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-radio.html',
    "<div><label>{{options.label}} {{options.required ? '*' : ''}}</label><div ng-repeat=\"(key, option) in options.options\"><label><input type=radio name={{id}} id=\"{{id + '_'+ $index}}\" aria-describedby={{id}}_description ng-value=option.value ng-required=options.required ng-model=$parent.value> {{option.name}}</label><p id={{id}}_description ng-if=option.description>{{option.description}}</p></div></div>"
  );


  $templateCache.put('fields/formly-field-select.html',
    "<div><label for={{id}}>{{options.label || 'Select'}} {{options.required ? '*' : ''}}</label><select id={{id}} aria-describedby={{id}}_description ng-model=value ng-required=options.required ng-disabled=options.disabled ng-options=\"option.value as option.name group by option.group for option in options.options\"></select><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-text.html',
    "<div><label for={{id}}>{{options.label || 'Text'}} {{options.required ? '*' : ''}}</label><input type=text id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-textarea.html',
    "<div><label for={{id}}>{{options.label || 'Text'}} {{options.required ? '*' : ''}}</label><textarea type=text id={{id}} rows={{options.lines}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value>\n" +
    "\t</textarea><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );

}]);
angular.module('formly.render').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('directives/formly-form.html',
    "<form class=formly role=form><formly-field ng-repeat=\"field in fields\" options=field form-result=result form-value=result[field.key||$index] form-id=options.uniqueFormId ng-if=!field.hide index=$index></formly-field><div ng-transclude></div></form>"
  );

}]);
angular.module('formly.render').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('fields/formly-field-checkbox.html',
    "<div><label><input type=checkbox aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value> {{options.label || 'Checkbox'}} {{options.required ? '*' : ''}}</label><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-email.html',
    "<div><label for={{id}}>{{options.label || 'Email'}} {{options.required ? '*' : ''}}</label><input type=email id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-hidden.html',
    "<input type=hidden ng-model=value>"
  );


  $templateCache.put('fields/formly-field-number.html',
    "<div><label for={{id}}>{{options.label || 'Number'}} {{options.required ? '*' : ''}}</label><input type=number id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled min={{options.min}} max={{options.max}} ng-minlength={{options.minlength}} ng-maxlength={{options.maxlength}} ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-password.html',
    "<div><label for={{id}}>{{options.label || 'Password'}} {{options.required ? '*' : ''}}</label><input type=password id={{id}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-trim=\"{{options.trimWhitespace || false}}\" ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-radio.html',
    "<div><label>{{options.label}} {{options.required ? '*' : ''}}</label><div ng-repeat=\"(key, option) in options.options\"><label><input type=radio name={{id}} id=\"{{id + '_'+ $index}}\" aria-describedby={{id}}_description ng-value=option.value ng-required=options.required ng-model=$parent.value> {{option.name}}</label><p id={{id}}_description ng-if=option.description>{{option.description}}</p></div></div>"
  );


  $templateCache.put('fields/formly-field-select.html',
    "<div><label for={{id}}>{{options.label || 'Select'}} {{options.required ? '*' : ''}}</label><select id={{id}} aria-describedby={{id}}_description ng-model=value ng-required=options.required ng-disabled=options.disabled ng-options=\"option.value as option.name group by option.group for option in options.options\"></select><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-text.html',
    "<div><label for={{id}}>{{options.label || 'Text'}} {{options.required ? '*' : ''}}</label><input type=text id={{id}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );


  $templateCache.put('fields/formly-field-textarea.html',
    "<div><label for={{id}}>{{options.label || 'Text'}} {{options.required ? '*' : ''}}</label><textarea type=text id={{id}} rows={{options.lines}} placeholder={{options.placeholder}} aria-describedby={{id}}_description ng-required=options.required ng-disabled=options.disabled ng-model=value>\n" +
    "\t</textarea><p id={{id}}_description ng-if=options.description>{{options.description}}</p></div>"
  );

}]);
angular.module('formly.render').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('directives/formly-form.html',
    "<form class=formly role=form><formly-field ng-repeat=\"field in fields\" options=field form-result=result form-value=result[field.key||$index] form-id=options.uniqueFormId ng-if=!field.hide index=$index></formly-field><div ng-transclude></div></form>"
  );

}]);

// This file adds the default templates to the formlyConfigProvider.
// It is excluded from the no-templates build.
angular.module('formly.render').config(["formlyConfigProvider", function(formlyConfigProvider) {
	'use strict';
	var fields = [
		'textarea', 'radio', 'select', 'number', 'checkbox',
		'password', 'hidden', 'email', 'text'
	];
	angular.forEach(fields, function(field) {
		formlyConfigProvider.setTemplateUrl(field, 'fields/formly-field-' + field + '.html');
	});
}]);