/*
 * Copyright (C) 2014-2018 Andrea Feccomandi
 *
 * Licensed under the terms of GNU GPL License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.gnu.org/licenses/gpl-2.0.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY.
 * See the GNU General Public License for more details.
 *
 */
angular.
  module('bibiscoApp').
  component('projecttitle', {
    templateUrl: 'components/project-home/project-title.html',
    controller: projectTitleController
  });

function projectTitleController(ProjectService) {

  var self = this;

  self.$onInit = function() {

    self.breadcrumbItems = [];
    self.breadcrumbItems.push({
      label: 'jsp.menu.project'
    });
    self.breadcrumbItems.push({
      label: 'jsp.project.dialog.title.updateTitle'
    });

    self.name = ProjectService.getProjectInfo().name;
  };

  self.save = function(title) {
    ProjectService.updateProjectName(title);
  };
}
