var config         = require('config')
, log            = require('debug')('app:user')
, pick           = require('lodash/pick');

const Password      = require('../lib/password');
const sanitize      = require('../util/sanitize');
const userHasRole 	= require('../lib/sequelize-authorization/lib/hasRole');
const getExtraDataConfig = require('../lib/sequelize-authorization/lib/getExtraDataConfig');
const roles = require('../lib/sequelize-authorization/lib/roles');

// For detecting throwaway accounts in the email address validation.
var emailBlackList = require('../../config/mail_blacklist')

module.exports = function( db, sequelize, DataTypes ) {
	var User = sequelize.define('user', {
		siteId: {
			type         : DataTypes.INTEGER,
			defaultValue : config.siteId && typeof config.siteId == 'number' ? config.siteId : 0,
		},

    externalUserId: {
      type         : DataTypes.INTEGER,
      auth: {
        listableBy: 'admin',
        viewableBy: 'admin',
        createableBy: 'admin',
        updateableBy: 'admin',
      },
			allowNull    : true,
			defaultValue : null
    },

    externalAccessToken: {
      type         : DataTypes.STRING(2048),
      auth: {
        listableBy: 'admin',
        viewableBy: 'admin',
        createableBy: 'admin',
        updateableBy: 'admin',
      },
			allowNull    : true,
			defaultValue : null
    },

		role: {
			type         : DataTypes.STRING(32),
      auth: {
        createableBy : 'admin',
        updateableBy : 'admin',
        viewableBy : 'all',
      },
			allowNull    : false,
			defaultValue : 'anonymous',
			validate     : {
				isIn: {
					args : [['unknown', 'anonymous', 'member', 'admin', 'su', 'editor', 'moderator', 'superAdmin']],
					msg  : 'Unknown user role'
				}
			},
      auth: {
        createableBy: 'admin',
        updateableBy: 'admin',
      },
		},
		// For unknown/anon: Always `false`.
		// For members: `true` when the user profile is complete. This is set
		//              to `false` by default, and should be set to `true`
		//              after the user has completed the registration. Until
		//              then, the 'complete registration' form should be displayed
		//              instead of any other content.

		complete: {
			type         : DataTypes.BOOLEAN,
			allowNull    : false,
			defaultValue : false
		},

		extraData: getExtraDataConfig(DataTypes.JSON, 'users'),

		email: {
			type         : DataTypes.STRING(255),
      auth: {
        listableBy: ['editor','owner'],
        viewableBy: ['editor','owner'],
        createableBy: ['editor','owner'],
        updateableBy: ['editor','owner'],
      },
			allowNull    : true,
			validate     : {
				isEmail: {
					msg: 'Geen geldig emailadres'
				},
				notBlackListed: function( email ) {
					var match = email && email.match(/^.+@(.+)$/);
					if (match) {
						let domainName = match[1];
						if( domainName in emailBlackList ) {
							throw Error('Graag je eigen emailadres gebruiken; geen tijdelijk account');
						}
					}
				}
			}
		},

		password: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			defaultValue : null,
      auth: {
        listableBy: 'none',
        viewableBy: 'none',
      },
			validate     : {
				len: {
					args : [6,64],
					msg  : 'Wachtwoord moet tussen 6 en 64 tekens zijn'
				}
			},
			set          : function( password ) {
				var method = config.get('security.passwordHashing.currentMethod');
				this.setDataValue('password', password);
				this.set('passwordHash', password ?
				         Password[method].hash(password) :
				         null
								);
			}
		},

		passwordHash: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			set          : function( hashObject ) {
				var hash = hashObject ? JSON.stringify(hashObject) : null;
				this.setDataValue('passwordHash', hash);
			}
		},

		nickName: {
			type         : DataTypes.STRING(64),
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('nickName', sanitize.noTags(value));
			}
		},

		firstName: {
			type         : DataTypes.STRING(64),
			auth: {
				listableBy: ['editor','owner'],
        viewableBy: 'all',
				createableBy: ['editor','owner'],
				updateableBy: ['editor','owner'],
			},
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('firstName', sanitize.noTags(value));
			}
		},

		lastName: {
			type         : DataTypes.STRING(64),
			auth: {
				listableBy: ['editor','owner'],
        viewableBy: 'all',
				createableBy: ['editor','owner'],
				updateableBy: ['editor','owner'],
			},
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('lastName', sanitize.noTags(value));
			}
		},

		listableByRole: {
			type: DataTypes.ENUM('admin', 'moderator', 'editor', 'member', 'anonymous', 'all'),
			defaultValue: null,
			auth:  {
        viewableBy: ['editor','owner'],
				updateableBy: ['editor', 'owner'],
			},
			allowNull: true,
		},

		detailsViewableByRole: {
			type: DataTypes.ENUM('admin', 'moderator', 'editor', 'member', 'anonymous', 'all'),
			defaultValue: null,
			auth:  {
        viewableBy: ['editor','owner'],
				updateableBy: ['editor', 'owner'],
			},
			allowNull: true,
		},

		phoneNumber: {
			type         : DataTypes.STRING(64),
			auth: {
				listableBy: ['editor','owner'],
				viewableBy: ['editor','owner'],
				createableBy: ['editor','owner'],
				updateableBy: ['editor','owner'],
			},
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('phoneNumber', sanitize.noTags(value));
			}
		},

		streetName: {
			type         : DataTypes.STRING(64),
			auth: {
				listableBy: ['editor','owner'],
				viewableBy: ['editor','owner'],
				createableBy: ['editor','owner'],
				updateableBy: ['editor','owner'],
			},
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('streetName', sanitize.noTags(value));
			}
		},

		houseNumber: {
			type         : DataTypes.STRING(64),
      auth: {
        listableBy: ['editor','owner'],
        viewableBy: ['editor','owner'],
        createableBy: ['editor','owner'],
        updateableBy: ['editor','owner'],
      },
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('houseNumber', sanitize.noTags(value));
			}
		},

		postcode: {
			type         : DataTypes.STRING(64),
      auth: {
        listableBy: ['editor','owner'],
        viewableBy: ['editor','owner'],
        createableBy: ['editor','owner'],
        updateableBy: ['editor','owner'],
      },
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('postcode', sanitize.noTags(value));
			}
		},

		city: {
			type         : DataTypes.STRING(64),
      auth: {
        listableBy: ['editor','owner'],
        viewableBy: ['editor','owner'],
        createableBy: ['editor','owner'],
        updateableBy: ['editor','owner'],
      },
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('city', sanitize.noTags(value));
			}
		},

		suffix: {
			type         : DataTypes.STRING(64),
      auth: {
        listableBy: ['editor','owner'],
        viewableBy: ['editor','owner'],
        createableBy: ['editor','owner'],
        updateableBy: ['editor','owner'],
      },
			allowNull    : true,
			set          : function( value ) {
				this.setDataValue('suffix', sanitize.noTags(value));
			}
		},

		fullName: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			get          : function() {
				var firstName = this.getDataValue('firstName') || '';
				var lastName  = this.getDataValue('lastName') || '';
				return firstName || lastName ?
				  (firstName+' '+lastName) :
				  undefined;
			}
		},

		initials: {
			type         : DataTypes.VIRTUAL,
			allowNull    : true,
			get          : function() {
				var firstName = this.getDataValue('firstName') || '';
				var lastName  = this.getDataValue('lastName') || '';
				var initials  = (firstName ? firstName.substr(0,1) : '') +
				    (lastName ? lastName.substr(0,1) : '');
				return initials.toUpperCase();
			}
		},

		gender: {
			type         : DataTypes.ENUM('male', 'female'),
			allowNull    : true,
			defaultValue : null,
		},

		zipCode: {
			type         : DataTypes.STRING(10),
      auth: {
        listableBy: ['editor','owner'],
        viewableBy: ['editor','owner'],
        createableBy: ['editor','owner'],
        updateableBy: ['editor','owner'],
      },
			allowNull    : true,
			validate     : {
				is: {
					args : [/^\d{4} ?[a-zA-Z]{2}$/],
					msg  : 'Ongeldige postcode'
				}
			},
			set          : function( zipCode ) {
				zipCode = zipCode ? String(zipCode).trim() : null;
				this.setDataValue('zipCode', zipCode);
			},

			postcode: {
				type         : DataTypes.STRING(10),
				auth: {
					listableBy: ['editor','owner'],
					viewableBy: ['editor','owner'],
					createableBy: ['editor','owner'],
					updateableBy: ['editor','owner'],
				},
				allowNull    : true,
				validate     : {
					is: {
						args : [/^\d{4} ?[a-zA-Z]{2}$/],
						msg  : 'Ongeldige postcode'
					}
				},
				set          : function( zipCode ) {
					zipCode = zipCode != null ?
						String(zipCode).trim() :
						null;
					this.setDataValue('zipCode', zipCode);
				},
			},
		},

		// signedUpForNewsletter: {
		//  	type         : DataTypes.BOOLEAN,
		//  	allowNull    : false,
		//  	defaultValue : false
		// },

	}, {
		charset: 'utf8',

	/*	indexes: [{
			fields: ['email'],
			unique: true
		}],*/


		validate: {
			hasValidUserRole: function() {
				if( this.id !== 1 && this.role === 'unknown' ) {
					throw new Error('User role \'unknown\' is not allowed');
				}
			},
			// isValidAnon: function() {
			// 	if( this.role === 'unknown' || this.role === 'anonymous' ) {
			// 		if( this.complete || this.email ) {
			// 			throw new Error('Anonymous users cannot be complete profiles or have a mail address');
			// 		}
			// 	}
			// },
			isValidMember: function() {
				// dit is niet langer relevant; mijnopenstad bepaald wat je default rol is
				// if( this.role !== 'unknown' && this.role !== 'anonymous' ) {
				//  	if( !this.email ) {
				//  		throw new Error('Onjuist email adres');
				//  	} else if( this.complete && (!this.firstName || !this.lastName) ) {
				//  		throw new Error('Voor- en achternaam zijn verplichte velden');
				//  	}
				// }
			},
			onlyMembersCanLogin: function() {
				if( this.role === 'unknown' || this.role === 'anonymous' ) {
					if( this.passwordHash ) {
						throw new Error('Anonymous profiles cannot have login credentials');
					}
				}
			}
		},

	});

	User.scopes = function scopes() {

		return {
			includeSite: {
        include: [{
          model: db.Site,
        }]
      },

			onlyListable: function (userId, userRole = 'all') {

        // todo: hij kan alleen tegen een enkelvoudige listableBy
        // todo: owner wordt nu altijd toegevoegd, dat moet alleen als die in listableBy staat, maar zie vorige regel
        // todo: gelijkttrekken met Idea.onlyVisible: die is nu exclusive en deze inclusive

        let requiredRole = this.auth && this.auth.listableBy || 'all';

        // if requiredRole == all then listableByRole is not relevant and neither is userRole
        if (requiredRole == 'all') return;

        // if requiredRole != all then listableByRole is allowing

        // null should be seen as requiredRole
        let requiredRoleEscaped = sequelize.escape(requiredRole);
        let rolesEscaped = sequelize.escape(roles[userRole])
        let nullCondition = `${requiredRoleEscaped} IN (${rolesEscaped})`;

        let where;
				if (userId) {
          where = sequelize.or(
            { id: userId }, // owner
            { listableByRole: roles[userRole] || 'none' }, // allow when userRole is good enough
            sequelize.and( // or null and userRole is at least requiredRole
              { listableByRole: null },
              sequelize.literal(nullCondition)
            ),
          )
        } else {
          where = sequelize.or(
            { listableByRole: roles[userRole] || 'none' }, // allow when userRole is good enough
            sequelize.and( // or null and userRole is at least requiredRole
              { listableByRole: null },
              sequelize.literal(nullCondition)
            ),
          )
        }

        return { where };

			},

			includeVote: {
				include: [{
					model: db.Vote,
				}]
			},


			onlyVisible: function (userId, userRole) {
				if (userId) {
					return {
						where: sequelize.or(
							{ id: userId },
							{ viewableByRole: 'all' },
							{ viewableByRole: roles[userRole] || 'all' },
						)
					};
				} else {
					return {
						where: sequelize.or(
							{ viewableByRole: 'all' },
							{ viewableByRole: roles[userRole]  || 'all' },
						)
					};
				}
 			},

		}
	}

	User.associate = function( models ) {
		this.hasMany(models.Article);
		this.hasMany(models.Idea);
		this.hasMany(models.Vote);
		this.hasMany(models.Argument);
		this.belongsTo(models.Site);
	}

	User.prototype.authenticate = function( password ) {
		var method = config.get('security.passwordHashing.currentMethod');
		if( !this.passwordHash ) {
			log('user %d has no passwordHash', this.id);
			return false;
		} else {
			var hash   = JSON.parse(this.passwordHash);
			var result = Password[method].compare(password, hash);
			log('authentication for user %d %s', this.id, result ? 'succeeded' : 'failed');
			return result;
		}
	}

	User.prototype.hasCompletedRegistration = function() {
		return this.email && this.complete // && this.isMember();
	}

	User.prototype.isUnknown = function() {
		return this.role === 'unknown';
	}

	User.prototype.isAnonymous = function() {
		return this.role === 'anonymous';
	}

	User.prototype.isMember = function() {
		return this.role !== 'unknown' && this.role !== 'anonymous';
	}

	User.prototype.isAdmin = function() {
		return this.role === 'admin' || this.role === 'su';
	}

	User.prototype.isLoggedIn = function() {
		return this.id && this.id !== 1 && this.isMember();
	}

	User.prototype.getUserVoteIdeaId = function() {
		let self = this;
		return db.Vote
			.findOne({ where: { userId: self.id }})
			.then(vote => {
				return vote ? vote.ideaId : undefined;
			})
	}

	User.prototype.hasVoted = function() {
		let self = this;
		return db.Vote
			.findOne({ where: { userId: self.id }})
			.then(vote => {
				return vote ? true : false;
			})
	}

	User.prototype.hasConfirmed = function() {
		let self = this;
		return db.Vote
			.findOne({ where: { userId: self.id, confirmed: 1, confirmIdeaId: null }})
			.then(vote => {
				return vote ? true : false;
			})
	}

	User.auth = User.prototype.auth = {
    listableBy: 'editor',
    viewableBy: 'all',
    createableBy: 'editor',
    updateableBy: ['editor','owner'],
    deleteableBy: ['editor','owner'],

		/*canView: function(user, self) {
			if (self && self.viewableByRole && self.viewableByRole != 'all' ) {
				return userHasRole(user, [ self.viewableByRole, 'owner' ], self.userId)
			} else {
				return true
			}
		},*/
  }

	return User;
};
