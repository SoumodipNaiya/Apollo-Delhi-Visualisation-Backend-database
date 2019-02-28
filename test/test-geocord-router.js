const expect = require('chai').expect;
const server = require('../app');
const request = require('supertest');
describe("Geocord router", () => {
    it("Should return geojson", (done) => {
        request(server).get('/loadgeojson')
        .expect((res) => {
            const t = JSON.parse(res.res.text);
            console.log(t);
            expect(t.length).to.be.equal(290);
            expect(t[0]).to.have.property('properties');
            
            expect(t[0].properties).to.have.property('wardno');
            expect(t[0].properties).to.have.property('ward_name');
            expect(t[0].properties).to.have.property('movement_id');
            expect(t[0].properties).to.have.property('display_name');
        })
        .expect(200,done);
    });

    it("Should return choropleth", (done) => {
        request(server).get('/init/choropleth')
        .expect((res) => {
            const t = JSON.parse(res.res.text);
            expect(Object.keys(t).length).to.be.equal(290);
        }).expect(200,done);
    });

    it("Should return chart for ward", (done) => {
        request(server).post('/chart')
        .send({mode: "normal", id: [20,98,203], layer: 'Demography', graph: 'Literacy'})
        .expect((res) => {
            const t = JSON.parse(res.res.text);
            expect(t).to.have.property('label');
            expect(t.label.length).to.be.equal(3);
            expect(t).to.have.property('values');
            expect(t.values.length).to.be.equal(1);
            expect(t.values[0]).to.have.property('data');
            expect(t.values[0]).to.have.property('label');
            expect(t.values[0].data.length).to.be.equal(3);
        }).expect(200,done);
    });

    it("Should return best fit", (done) => {
        request(server).post('/chart')
        .send({layer: "best fit", graph: "competitive catchment"})
        .expect((res) => {
            const t = JSON.parse(res.res.text);
            expect(t.length).to.be.equal(11);
            t.forEach((data) => {
                expect(data).to.have.property('latlng');
                expect(data).to.have.property('radius');
                expect(data.latlng.length).to.be.equal(2);
            });
        })
        .expect(200,done);
    });

});