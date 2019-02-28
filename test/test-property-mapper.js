const expect = require('chai').expect;
const property_mapper = require('../extra/property_mapper')
describe("Property mapper", () => {
    it("Should return property 1 level deep", (done) => {
        let obj = {
            a: 1,
            b: 2,
            c: 3
        };
        let result = property_mapper(obj, "a");
        expect(result).to.be.equal(1);
        result = property_mapper(obj, "b");
        expect(result).to.be.equal(2);
        result = property_mapper(obj, "c");
        expect(result).to.be.equal(3);

        done();
    });

    it("Should return property two levels deep", (done) => {
        let obj = {
            a: {
                a1: 1,
                a2: 2
            },
            b: {
                b1: 1,
                b2: 2
            }
        }
        let result = property_mapper(obj, "a.a1");
        expect(result).to.be.equal(1);
        result = property_mapper(obj, "a.a2");
        expect(result).to.be.equal(2);
        result = property_mapper(obj, "b.b1");
        expect(result).to.be.equal(1);
        result = property_mapper(obj, "b.b2");
        expect(result).to.be.equal(2);

        done();
    });
});