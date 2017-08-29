const LOGGER = require('@calzoneman/jsli')('AccountDB');

class AccountDB {
    constructor(db) {
        this.db = db;
    }

    getByName(name) {
        return this.db.runTransaction(async tx => {
            const rows = await tx.table('users').where({ name }).select();

            if (rows.length === 0) {
                return null;
            }

            return this.mapUser(rows[0]);
        });
    }

    updateByName(name, changedFields) {
        return this.db.runTransaction(tx => {
            if (changedFields.profile) {
                changedFields.profile = JSON.stringify(changedFields.profile);
            }

            return tx.table('users')
                    .update(changedFields)
                    .where({ name })
                    .then(rowsUpdated => {
                if (rowsUpdated === 0) {
                    throw new Error(`Cannot update: name "${name}" does not exist`);
                }
            });
        });
    }

    mapUser(user) {
        // Backwards compatibility
        // Maybe worth backfilling one day to be done with it?
        try {
            let profile;

            if (!user.profile) {
                profile = { image: '', text: '' };
            } else {
                profile = JSON.parse(user.profile);
            }

            if (!profile.image) profile.image = '';
            if (!profile.text) profile.text = '';

            user.profile = profile;
        } catch (error) {
            // TODO: backfill erroneous records and remove this check
            LOGGER.warn('Invalid profile "%s": %s', user.profile, error);
            user.profile = { image: '', text: '' };
        }

        user.time = new Date(user.time);

        return user;
    }
}

export { AccountDB };