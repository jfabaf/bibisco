/*
 * Copyright (C) 2014-2017 Andrea Feccomandi
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

angular.module('bibiscoApp').service('ChapterService', function(
  CollectionUtilService, LoggerService, ProjectDbConnectionService) {
  'use strict';

  var collection = ProjectDbConnectionService.getProjectDb().getCollection(
    'chapters');
  var chapterinfoscollection = ProjectDbConnectionService.getProjectDb().getCollection(
    'chapter_infos');
  var dynamicView = CollectionUtilService.getDynamicViewSortedByPosition(
    collection, 'all_chapters');
  var scenecollection = ProjectDbConnectionService.getProjectDb().getCollection(
    'scenes');
  var scenerevisionscollection = ProjectDbConnectionService.getProjectDb().getCollection(
    'scene_revisions');

  return {

    getChapter: function(id) {
      return collection.get(id);
    },
    getChapterInfo: function(id) {
      return chapterinfoscollection.get(id);
    },
    getChaptersCount: function() {
      return collection.count();
    },
    getChapters: function() {
      return dynamicView.data();
    },
    insert: function(chapter) {

      // insert chapter
      chapter.reason = -1;
      chapter.notes = -1;
      chapter = CollectionUtilService.insertWithoutCommit(collection,
        chapter);

      // insert reason chapter info
      let reason = this.insertChapterInfoWithoutCommit(chapter.$loki,
        'reason');

      // insert notes info
      let notes = this.insertChapterInfoWithoutCommit(chapter.$loki,
        'notes');

      // update notes with null status
      notes.status = null;
      CollectionUtilService.updateWithoutCommit(chapterinfoscollection,
        notes);

      // update chapter with info
      chapter.reason = reason.$loki;
      chapter.notes = notes.$loki;
      CollectionUtilService.updateWithoutCommit(collection, chapter);

      // save database
      ProjectDbConnectionService.saveDatabase();
    },

    insertChapterInfoWithoutCommit: function(chapterid, type) {
      return CollectionUtilService.insertWithoutCommit(
        chapterinfoscollection, {
          chapterid: chapterid,
          type: type,
          text: ''
        }, {
          chapterid: {
            '$eq': chapterid
          }
        });
    },

    move: function(sourceId, targetId) {
      return CollectionUtilService.move(collection, sourceId, targetId,
        dynamicView);
    },
    remove: function(id) {
      CollectionUtilService.remove(collection, id);
    },

    update: function(chapter) {
      CollectionUtilService.update(collection, chapter);
    },

    updateChapterInfo: function(chapterinfo) {

      // update chapter info
      CollectionUtilService.updateWithoutCommit(chapterinfoscollection,
        chapterinfo);

      // update chapter status
      this.updateChapterStatusWordsCharactersWithoutCommit(chapterinfo.chapterid);

      // save database
      ProjectDbConnectionService.saveDatabase();
    },

    updateChapterStatusWordsCharactersWithoutCommit: function(id) {

      // get chapter
      let chapter = collection.get(id);

      // get chapter reason
      let chapterReason = chapterinfoscollection.findOne({
        chapterid: id,
        type: 'reason'
      });

      // get scenes
      let scenes = ChapterService.getScenes(id);

      // total statuses: all scenes + reason card
      let totalStatuses = scenes.length + 1;
      let totalTodo = 0;
      let totalDone = 0;

      if (chapterReason.status == 'todo') {
        totalTodo = 1;
      } else if (chapterReason.status == 'done') {
        totalDone = 1;
      }

      for (let i = 0; i < scenes.length; i++) {
        if (scenes[i].status == 'todo') {
          totalTodo = totalTodo + 1;
        } else if (scenes[i].status == 'done') {
          totalDone = totalDone + 1;
        }
      }

      if (totalTodo == totalStatuses) {
        chapter.status = 'todo';
      } else if (totalDone == totalStatuses) {
        chapter.status = 'done';
      } else {
        chapter.status = 'tocomplete';
      }

      CollectionUtilService.updateWithoutCommit(collection, chapter);
    },

    changeSceneRevision: function(id, revision) {
      let scene = scenecollection.get(id);
      let scenerevision = this.getSceneRevisionByPosition(id, revision);

      // update scene with revision info
      scene.revisionid = scenerevision.$loki;
      scene.revision = scenerevision.position;
      CollectionUtilService.update(scenecollection, scene);

      return this.getScene(id);
    },

    createSceneRevision: function(id, fromActual) {

      let scene = scenecollection.get(id);
      let actualscenerevision = scenerevisionscollection.get(scene.revisionid);

      // get revision text
      let text;
      if (fromActual) {
        text = actualscenerevision.text;
      } else {
        text = '';
      }

      // insert new revision
      let scenerevision = this.insertSceneRevision(scene.$loki, text);

      // update scene with revision info
      scene.revisionid = scenerevision.$loki;
      scene.revision = scenerevision.position;
      scene.revisioncount = scene.revisioncount + 1;
      CollectionUtilService.updateWithoutCommit(scenecollection, scene);

      // save database
      ProjectDbConnectionService.saveDatabase();

      if (fromActual) {
        LoggerService.info('Created revision ' + scene.revision +
          ' from revision ' + actualscenerevision.position +
          ' for scene with id=' + scene.$loki
        );
      } else {
        LoggerService.info('Created revision ' + scene.revision +
          ' from scratch for scene with id=' + scene.$loki
        );
      }

      return this.getScene(id);
    },
    createSceneRevisionFromActual: function(id) {
      return this.createSceneRevision(id, true);
    },
    createSceneRevisionFromScratch: function(id) {
      return this.createSceneRevision(id, false);
    },

    deleteActualSceneRevision: function(id) {

      let scene = scenecollection.get(id);

      // remove actual revision
      CollectionUtilService.removeWithoutCommit(scenerevisionscollection,
        scene.revisionid, {
          sceneid: {
            '$eq': parseInt(id)
          }
        });

      // get the new revision
      let newrevision = this.getSceneRevisionByPosition(id, (scene.revisioncount -
        1));

      // update scene with revision info
      scene.revisionid = newrevision.$loki;
      scene.revision = newrevision.position;
      scene.revisioncount = scene.revisioncount - 1;
      CollectionUtilService.updateWithoutCommit(scenecollection, scene);

      // save database
      ProjectDbConnectionService.saveDatabase();

      return this.getScene(id);
    },

    getScene: function(id) {
      let scene = scenecollection.get(id);
      let scenerevision = scenerevisionscollection.get(scene.revisionid);

      scene.characters = scenerevision.characters;
      scene.lastsave = scenerevision.lastsave;
      scene.revision = scenerevision.position;
      scene.text = scenerevision.text;
      scene.words = scenerevision.words;

      return scene;
    },

    getSceneRevisionByPosition: function(sceneid, revisionposition) {
      return scenerevisionscollection.findOne({
        sceneid: parseInt(sceneid),
        position: parseInt(revisionposition)
      });
    },

    getScenesCount: function(chapterid) {
      return scenecollection.count({
        'chapterid': chapterid
      });
    },

    getScenes: function(chapterid) {
      let chapterscenes = CollectionUtilService.getDynamicViewSortedByPosition(
        scenecollection, 'chapterscenes_' + chapterid, {
          chapterid: {
            '$eq': chapterid
          }
        });

      return chapterscenes.data();
    },

    insertScene: function(scene) {

      // insert scene
      scene.revisioncount = 1;
      scene.revisionid = -1;
      scene = CollectionUtilService.insertWithoutCommit(scenecollection,
        scene, {
          chapterid: {
            '$eq': scene.chapterid
          }
        });

      // insert first revision
      let scenerevision = this.insertSceneRevision(scene.$loki, '');

      // update scene with revision info
      scene.revisionid = scenerevision.$loki;
      scene.revision = scenerevision.position;
      CollectionUtilService.updateWithoutCommit(scenecollection, scene);

      // save database
      ProjectDbConnectionService.saveDatabase();
    },

    insertSceneRevision: function(sceneid, text) {
      return CollectionUtilService.insertWithoutCommit(
        scenerevisionscollection, {
          sceneid: sceneid,
          text: text
        }, {
          sceneid: {
            '$eq': sceneid
          }
        });
    },

    moveScene: function(sourceId, targetId) {
      let chapterid = this.getScene(sourceId).chapterid;
      let chapterscenes = CollectionUtilService.getDynamicViewSortedByPosition(
        scenecollection, 'chapterscenes_' + chapterid, {
          chapterid: {
            '$eq': chapterid
          }
        });
      return CollectionUtilService.move(scenecollection, sourceId,
        targetId,
        chapterscenes, {
          chapterid: {
            '$eq': chapterid
          }
        });
    },

    removeScene: function(id) {
      CollectionUtilService.remove(scenecollection, id);
    },

    updateScene: function(scene) {

      // update scene
      CollectionUtilService.updateWithoutCommit(scenecollection, scene);

      // update scene revision
      let scenerevision = scenerevisionscollection.get(scene.revisionid);
      scenerevision.characters = scene.characters;
      scenerevision.lastsave = scene.lastsave;
      scenerevision.text = scene.text;
      scenerevision.words = scene.words;

      CollectionUtilService.updateWithoutCommit(
        scenerevisionscollection, scenerevision);

      // update chapter status
      // ChapterService.updateChapterStatusWordsCharactersWithoutCommit(
      //   scene.chapterid);

      // save database
      ProjectDbConnectionService.saveDatabase();
    },

    updateSceneTitle: function(scene) {
      CollectionUtilService.update(scenecollection, scene);
    }
  }
});
