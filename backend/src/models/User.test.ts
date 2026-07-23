import { describe, expect, it } from 'vitest';
import { User } from './User';

describe('Modèle User', () => {
  it('hache le mot de passe au lieu de le stocker en clair', async () => {
    const user = new User({ email: "bogus@bogus.net", passwordHash: "motdepasse123" }) ;
    const savedUser = await user.save();
    const resultingUser = savedUser.toObject() ;
    expect(resultingUser.passwordHash).not.toBe( "motdepasse123") ;
  });

  it('comparePassword retourne true pour le bon mot de passe', async () => {
    const user = new User({ email: "bogus@bogus.net", passwordHash: "motdepasse123" }) ;
    const savedUser = await user.save();
    expect(await savedUser.comparePassword("motdepasse123")).toBe(true);
  });

  it('comparePassword retourne false pour un mauvais mot de passe', async () => {
    const user = new User({ email: "bogus@bogus.net", passwordHash: "motdepasse123" }) ;
    const savedUser = await user.save();
    expect(await savedUser.comparePassword("motdepasse12345")).toBe(false);
  });

  it('exige un email', async () => {
    const user = new User({ passwordHash: "motdepasse123" });
    await expect(user.save()).rejects.toThrow();
  });

  it("rejette un format d'email invalide", async () => {
    const user = new User({ email: "pas-un-email", passwordHash: "motdepasse123" }) ;
    await expect(user.save()).rejects.toThrow() ;
  });
});
