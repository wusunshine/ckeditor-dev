/* bender-tags: editor,clipboard,widget */
/* bender-ckeditor-plugins: easyimage,toolbar, */
/* bender-include: %BASE_PATH%/plugins/clipboard/_helpers/pasting.js */
/* bender-include: %BASE_PATH%/plugins/uploadfile/_helpers/waitForImage.js */
/* global pasteFiles, waitForImage */

( function() {
	'use strict';

	var uploadCount, loadAndUploadCount, resumeAfter, tests,
		IMG_URL = '%BASE_PATH%_assets/logo.png',
		DATA_IMG = 'data:',
		BLOB_IMG = 'blob:',
		commonConfig = {
			cloudServices_url: 'http://foo/upload',
			// Disable pasteFilter on Webkits (pasteFilter defaults semantic-text on Webkits).
			pasteFilter: null
		};

	bender.editors = {
		classic: {
			name: 'classic',
			config: commonConfig
		},

		divarea: {
			name: 'divarea',
			config: CKEDITOR.tools.extend( { extraPlugins: 'divarea' }, commonConfig )
		},

		inline: {
			name: 'inline',
			creator: 'inline',
			config: commonConfig
		}
	};

	function assertUploadingWidgets( editor, expectedSrc ) {
		var widgets = editor.editable().find( 'img[data-widget="uploadeasyimage"]' ),
			widget, i;

		assert.areSame( 1, widgets.count(), 'Expected widgets count should be 1' );

		for ( i = 0; i < widgets.count(); i++ ) {
			widget = widgets.getItem( i );
			assert.areSame( '0', widget.getAttribute( 'data-cke-upload-id' ) );
			assert.areSame( expectedSrc, widget.getAttribute( 'src' ).substring( 0, 5 ) );
		}
	}

	tests = {
		init: function() {
			var responseData = {
				response: {
					100: IMG_URL,
					200: IMG_URL
				}
			};

			responseData.response[ 'default' ] = IMG_URL;
			resumeAfter = bender.tools.resumeAfter;

			// Approach taken from tests/plugins/uploadwidget/uploadwidget.js test.
			CKEDITOR.plugins.cloudservices.cloudServicesLoader.prototype.loadAndUpload = function() {
				loadAndUploadCount++;

				this.responseData = CKEDITOR.tools.clone( responseData );
			};

			CKEDITOR.plugins.cloudservices.cloudServicesLoader.prototype.load = function() {};

			sinon.stub( CKEDITOR.plugins.cloudservices.cloudServicesLoader.prototype, 'upload', function() {
				uploadCount++;
				this.responseData = CKEDITOR.tools.clone( responseData );
			} );
		},

		setUp: function() {
			if ( !CKEDITOR.plugins.clipboard.isFileApiSupported ) {
				assert.ignore();
			}

			var editorName;

			uploadCount = 0;
			loadAndUploadCount = 0;

			for ( editorName in this.editors ) {
				// Clear upload repository.
				this.editors[ editorName ].uploadRepository.loaders = [];
			}

			if ( CKEDITOR.fileTools.bindNotifications.reset ) {
				CKEDITOR.fileTools.bindNotifications.reset();
			}

			if ( CKEDITOR.plugins.cloudservices.cloudServicesLoader.prototype.upload.reset ) {
				CKEDITOR.plugins.cloudservices.cloudServicesLoader.prototype.upload.reset();
			}
		},

		'test classic with easyimage (integration test)': function( editor ) {
			pasteFiles( editor, [ bender.tools.getTestPngFile() ] );

			assertUploadingWidgets( editor, DATA_IMG );
			assert.areSame( '', editor.getData(), 'getData on loading.' );

			var loader = editor.uploadRepository.loaders[ 0 ];

			loader.data = bender.tools.pngBase64;
			loader.uploadTotal = 10;
			loader.changeStatus( 'uploading' );

			assertUploadingWidgets( editor, BLOB_IMG );
			assert.areSame( '', editor.getData(), 'getData on uploading.' );

			var image = editor.editable().find( 'img[data-widget="uploadeasyimage"]' ).getItem( 0 );

			waitForImage( image, function() {
				loader.url = IMG_URL;
				loader.changeStatus( 'uploaded' );

				assert.sameData( '<p><img alt="" src="' + IMG_URL + '" /></p>', editor.getData() );
				assert.areSame( 1, editor.editable().find( 'img[data-widget="image"]' ).count() );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 1, uploadCount );
			} );
		},

		'test paste img as html (integration test)': function( editor, bot ) {
			bot.setData( '', function() {
				pasteFiles( editor, [], '<p>x<img src="' + bender.tools.pngBase64 + '">x</p>' );

				assertUploadingWidgets( editor, DATA_IMG );
				assert.areSame( '<p>xx</p>', editor.getData(), 'getData on loading.' );

				var loader = editor.uploadRepository.loaders[ 0 ];

				loader.data = bender.tools.pngBase64;
				loader.changeStatus( 'uploading' );

				assertUploadingWidgets( editor, BLOB_IMG );
				assert.areSame( '<p>xx</p>', editor.getData(), 'getData on uploading.' );

				var image = editor.editable().find( 'img[data-widget="uploadeasyimage"]' ).getItem( 0 );

				waitForImage( image, function() {
					loader.url = IMG_URL;
					loader.changeStatus( 'uploaded' );

					assert.sameData( '<p>x<img alt="" src="' + IMG_URL + '" />x</p>', editor.getData() );
					assert.areSame( 1, editor.editable().find( 'img[data-widget="image"]' ).count() );

					assert.areSame( 0, loadAndUploadCount );
					assert.areSame( 1, uploadCount );
				} );
			} );
		},

		'test supportedTypes png': function( editor, bot ) {
			bot.setData( '', function() {
				resumeAfter( editor, 'paste', function() {
					assertUploadingWidgets( editor, DATA_IMG );
				} );

				pasteFiles( editor, [ { name: 'test.png', type: 'image/png' } ] );

				wait();
			} );
		},

		'test supportedTypes jpg': function( editor, bot ) {
			bot.setData( '', function() {
				resumeAfter( editor, 'paste', function() {
					assertUploadingWidgets( editor, DATA_IMG );
				} );

				pasteFiles( editor, [ { name: 'test.jpg', type: 'image/jpeg' } ] );

				wait();
			} );
		},

		'test supportedTypes gif': function( editor, bot ) {
			bot.setData( '', function() {
				resumeAfter( editor, 'paste', function() {
					assertUploadingWidgets( editor, DATA_IMG );
				} );

				pasteFiles( editor, [ { name: 'test.gif', type: 'image/gif' } ] );

				wait();
			} );
		},

		'test supportedTypes bmp': function( editor, bot ) {
			bot.setData( '', function() {
				resumeAfter( editor, 'paste', function() {
					assertUploadingWidgets( editor, DATA_IMG );
				} );

				pasteFiles( editor, [ { name: 'test.bmp', type: 'image/bmp' } ] );

				wait();
			} );
		},

		'test not supportedTypes tiff': function( editor, bot ) {
			bot.setData( '', function() {
				resumeAfter( editor, 'paste', function() {
					assert.areSame( 0, editor.editable().find( 'img[data-widget="uploadeasyimage"]' ).count() );
				} );

				pasteFiles( editor, [ { name: 'test.tiff', type: 'image/tiff' } ] );

				wait();
			} );
		},

		'test paste single image': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				var img = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue );

				assert.areSame( '0', img.getAttribute( 'data-cke-upload-id' ) );
				assert.areSame( 'uploadeasyimage', img.getAttribute( 'data-widget' ) );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 1, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue: '<img src="' + bender.tools.pngBase64 + '">'
			} );

			wait();
		},

		'test paste nested image': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				var imgs = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue ).find( 'img[data-widget="uploadeasyimage"]' ),
					img, i;

				assert.areSame( 2, imgs.count(), 'Expected imgs count should be 2' );

				for ( i = 0; i < imgs.count(); i++ ) {
					img = imgs.getItem( i );
					assert.areSame( i + '', img.getAttribute( 'data-cke-upload-id' ) );
				}

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 2, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue: '<div>x<img src="' + bender.tools.pngBase64 + '">x' +
							'<p>x<img src="' + bender.tools.pngBase64 + '">x</p></div>'
			} );

			wait();
		},

		'test paste no image': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				assert.areSame( 'foo', evt.data.dataValue );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 0, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue: 'foo'
			} );

			wait();
		},

		'test paste no data in image': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				var img = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue );

				assert.isNull( img.getAttribute( 'data-cke-upload-id' ) );
				assert.isNull( img.getAttribute( 'data-widget' ) );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 0, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue: '<img src="' + IMG_URL + '">'
			} );

			wait();
		},

		'test paste image already marked': function( editor ) {
			var uploads = editor.uploadRepository;

			resumeAfter( editor, 'paste', function( evt ) {
				var img = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue );

				assert.areSame( '0', img.getAttribute( 'data-cke-upload-id' ) );
				assert.areSame( 'uploadeasyimage', img.getAttribute( 'data-widget' ) );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 0, uploadCount );
			} );

			// Fill upload repository.
			uploads.create( bender.tools.getTestPngFile() );

			editor.fire( 'paste', {
				dataValue: '<img src="' + bender.tools.pngBase64 + '" data-widget="uploadeasyimage" data-cke-upload-id="0">'
			} );

			wait();
		},

		'test omit images in non contentEditable': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				var img = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue ).findOne( 'img' );

				assert.isNull( img.getAttribute( 'data-cke-upload-id' ) );
				assert.isNull( img.getAttribute( 'data-widget' ) );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 0, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue:
					'<div contentEditable="false">' +
						'<img src="' + bender.tools.pngBase64 + '">' +
					'</div>'
			} );

			wait();
		},

		'test handle images in nested editable': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				var img = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue ).findOne( 'img' );

				assert.areSame( '0', img.getAttribute( 'data-cke-upload-id' ) );
				assert.areSame( 'uploadeasyimage', img.getAttribute( 'data-widget' ) );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 1, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue:
					'<div contentEditable="false">' +
						'<div contentEditable="true">' +
							'<img src="' + bender.tools.pngBase64 + '">' +
						'</div>' +
					'</div>'
			} );

			wait();
		},

		'test handle images in nested editable using cke-editable': function( editor ) {
			resumeAfter( editor, 'paste', function( evt ) {
				var img = CKEDITOR.dom.element.createFromHtml( evt.data.dataValue ).findOne( 'img' );

				assert.areSame( '0', img.getAttribute( 'data-cke-upload-id' ) );
				assert.areSame( 'uploadeasyimage', img.getAttribute( 'data-widget' ) );

				assert.areSame( 0, loadAndUploadCount );
				assert.areSame( 1, uploadCount );
			} );

			editor.fire( 'paste', {
				dataValue:
					'<div contentEditable="false">' +
						'<div data-cke-editable="1">' +
							'<img src="' + bender.tools.pngBase64 + '">' +
						'</div>' +
					'</div>'
			} );

			wait();
		},

		'test bindNotifications when paste image': function( editor ) {
			CKEDITOR.fileTools.bindNotifications = sinon.spy();

			resumeAfter( editor, 'paste', function() {
				var spy = CKEDITOR.fileTools.bindNotifications;
				assert.areSame( 1, spy.callCount );
				assert.isTrue( spy.calledWith( editor ) );
				assert.areSame( bender.tools.pngBase64, spy.firstCall.args[ 1 ].data );
			} );

			editor.fire( 'paste', {
				dataValue: '<img src="' + bender.tools.pngBase64 + '">'
			} );

			wait();
		},

		'test XSS attack': function( editor ) {
			window.attacked = sinon.spy();

			editor.fire( 'paste', {
				dataValue: '<img src="x" onerror="window.attacked();">' + bender.tools.pngBase64
			} );

			editor.once( 'afterPaste', function() {
				resume( function() {
					assert.areSame( 0, window.attacked.callCount );
				} );
			} );

			wait();
		},

		'test prevent upload fake elements (http://dev.ckeditor.com/ticket/13003)': function( editor ) {
			var createspy = sinon.spy( editor.uploadRepository, 'create' );

			editor.fire( 'paste', {
				dataValue: '<img src="data:image/gif;base64,aw==" alt="nothing" data-cke-realelement="some" />'
			} );

			editor.once( 'afterPaste', function() {
				resume( function() {
					assert.isTrue( createspy.notCalled );
				} );
			} );

			wait();
		},

		'test cloudservices URL/request params can be customized': function( editor ) {
			var uploadEasyImageDef = editor.widgets.registered.uploadeasyimage,
				originalUploadUrl = uploadEasyImageDef.uploadUrl,
				originalAdditionalParams = uploadEasyImageDef.additionalRequestParameters,
				loader;

			// Upload widget might have an uploadUrl changed in definition, allowing for upload URL customization.
			uploadEasyImageDef.uploadUrl = 'https://customDomain.localhost/endpoint';
			uploadEasyImageDef.additionalRequestParameters = { a: 1 };

			resumeAfter( editor, 'paste', function() {
				// Restore original value.
				uploadEasyImageDef.uploadUrl = originalUploadUrl;
				uploadEasyImageDef.additionalRequestParameters = originalAdditionalParams;

				loader = editor.uploadRepository.loaders[ 0 ];

				sinon.assert.calledWith( loader.upload, 'https://customDomain.localhost/endpoint', { a: 1 } );
				assert.isTrue( true );
			} );

			editor.fire( 'paste', {
				dataValue: '<img src="' + bender.tools.pngBase64 + '">'
			} );

			wait();
		},

		'test loader type can be customized': function( editor ) {
			var uploadEasyImageDef = editor.widgets.registered.uploadeasyimage,
				originalType = uploadEasyImageDef.loaderType,
				CloudServicesLoader = CKEDITOR.plugins.cloudservices.cloudServicesLoader,
				loader;

			function LoaderSubclass( editor, fileOrData, fileName, token ) {
				CloudServicesLoader.call( this, editor, fileOrData, fileName, token );
			}

			LoaderSubclass.prototype = CKEDITOR.tools.extend( {}, CloudServicesLoader.prototype );

			// Upload widget might have a loaderType changed in definition, allowing for loader type customization.
			uploadEasyImageDef.loaderType = LoaderSubclass;

			resumeAfter( editor, 'paste', function() {
				// Restore original value.
				uploadEasyImageDef.loaderType = originalType;

				loader = editor.uploadRepository.loaders[ 0 ];

				assert.isInstanceOf( LoaderSubclass, loader, 'Loader type' );
			} );

			editor.fire( 'paste', {
				dataValue: '<img src="' + bender.tools.pngBase64 + '">'
			} );

			wait();
		}
	};

	tests = bender.tools.createTestsForEditors( CKEDITOR.tools.objectKeys( bender.editors ), tests );
	bender.test( tests );
} )();
